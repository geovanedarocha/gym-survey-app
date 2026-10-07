/**
 * post-build-transpile.js
 * 
 * Script pós-build que garante compatibilidade total com Safari 10 no iOS 10.3.4:
 * 1. Transpila TODOS os bundles JS na pasta `out/` usando @babel/preset-env direcionado
 *    para iOS 10 / Safari 10, eliminando:
 *    - Optional Chaining (?.)
 *    - Nullish Coalescing (??)
 *    - Logical Assignment (&&=, ||=, ??=)
 *    - Numeric Separators (1_000)
 *    - Object Spread / Rest não transpilado
 *    - Sintaxe ES2017-ES2023 no runtime interno do Next.js
 * 2. Corrige os ficheiros HTML na pasta `out/`:
 *    - Remove o atributo `noModule=""` / `nomodule` do bundle de polyfills para
 *      garantir execução no Safari 10.
 *    - Garante que os polyfills rodem sincronamente no <head> antes de qualquer chunk.
 */

const { transformFileSync } = require("@babel/core");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.resolve(__dirname, "out");

const safeDeletePlugin = ({ types: t }) => ({
  visitor: {
    UnaryExpression(path) {
      if (path.node.operator === "delete" && t.isMemberExpression(path.node.argument)) {
        const member = path.node.argument;
        const obj = member.object;
        const prop = member.computed
          ? member.property
          : t.stringLiteral(member.property.name || (t.isStringLiteral(member.property) ? member.property.value : ""));

        path.replaceWith(
          t.callExpression(t.identifier("__ios10SafeDelete"), [obj, prop])
        );
      }
    },
  },
});

const BABEL_CONFIG = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { ios: "10", safari: "10" },
        modules: false,
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-logical-assignment-operators",
    "@babel/plugin-transform-numeric-separator",
    "@babel/plugin-transform-optional-chaining",
    "@babel/plugin-transform-nullish-coalescing-operator",
    safeDeletePlugin,
  ],
  compact: true,
  sourceMaps: false,
};

const HELPER_PREFIX =
  'var __ios10SafeDelete=typeof window!=="undefined"&&window.__ios10SafeDelete?window.__ios10SafeDelete:function(o,p){if(!o)return!0;try{return delete o[p];}catch(e){try{if(typeof document!=="undefined"&&o===document.documentElement.dataset&&document.documentElement.removeAttribute){var a="data-"+String(p).replace(/([A-Z])/g,"-$1").toLowerCase();document.documentElement.removeAttribute(a);}}catch(e2){}try{o[p]=undefined;}catch(e3){}return!1;}};if(typeof window!=="undefined"&&!window.__ios10SafeDelete){window.__ios10SafeDelete=__ios10SafeDelete;}\n';

let totalJs = 0;
let modifiedJs = 0;
let totalHtml = 0;
let modifiedHtml = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".js")) {
        processJsFile(fullPath);
      } else if (entry.name.endsWith(".html")) {
        processHtmlFile(fullPath);
      }
    }
  }
}

function processJsFile(filePath) {
  totalJs++;
  try {
    const result = transformFileSync(filePath, BABEL_CONFIG);
    if (result && result.code) {
      const codeToWrite = result.code.includes("__ios10SafeDelete")
        ? HELPER_PREFIX + result.code
        : result.code;
      fs.writeFileSync(filePath, codeToWrite, "utf-8");
      modifiedJs++;
      const rel = path.relative(OUT_DIR, filePath);
      console.log(`  ✓ Transpiled JS: ${rel}`);
    }
  } catch (err) {
    const rel = path.relative(OUT_DIR, filePath);
    console.error(`  ✗ Error transpiling ${rel}: ${err.message}`);
  }
}

function processHtmlFile(filePath) {
  totalHtml++;
  try {
    let content = fs.readFileSync(filePath, "utf-8");
    let changed = false;

    // 1. Remover qualquer atributo noModule ou nomodule de qualquer script
    const cleanContent = content
      .replace(/\s+nomodule(?:="[^"]*")?/gi, "")
      .replace(/\s+noModule(?:="[^"]*")?/gi, "");
    if (cleanContent !== content) {
      content = cleanContent;
      changed = true;
    }

    // 2. Extrair o inline script de inicialização/diagnóstico (<script>...window.onerror...__ios10SafeDelete...</script>)
    // e reposicioná-lo logo após a abertura da tag <head>, ANTES de qualquer outro script externo ou link
    const inlineScriptMatch = content.match(/<script>(?:[\s\S]*?window\.onerror[\s\S]*?)<\/script>/i);
    if (inlineScriptMatch) {
      const inlineTag = inlineScriptMatch[0];
      content = content.replace(inlineTag, "");
      const headIdx = content.indexOf("<head>");
      if (headIdx !== -1) {
        content = content.substring(0, headIdx + 6) + inlineTag + content.substring(headIdx + 6);
        changed = true;
      }
    }

    // 3. Garantir que o polyfill execute no <head> antes dos chunks async
    const polyfillMatch = content.match(/<script[^>]+?static\/chunks\/polyfills-[^>]+?><\/script>/i);
    if (polyfillMatch) {
      const polyfillTag = polyfillMatch[0];
      // Remover a tag da posição atual
      content = content.replace(polyfillTag, "");
      // Inserir logo antes do primeiro script de chunks
      const firstChunkIdx = content.indexOf('<script src="/_next/static/chunks/');
      if (firstChunkIdx !== -1) {
        content = content.substring(0, firstChunkIdx) + polyfillTag + content.substring(firstChunkIdx);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, "utf-8");
      modifiedHtml++;
      const rel = path.relative(OUT_DIR, filePath);
      console.log(`  ✓ Patched HTML: ${rel}`);
    }
  } catch (err) {
    const rel = path.relative(OUT_DIR, filePath);
    console.error(`  ✗ Error patching HTML ${rel}: ${err.message}`);
  }
}

console.log("==================================================");
console.log("🔧 Starting post-build iOS 10 hardening...");
console.log(`   Target: ${OUT_DIR}`);
console.log("==================================================");

walkDir(OUT_DIR);

console.log("");
console.log(`✅ Complete! ${modifiedJs}/${totalJs} JS files transpiled for iOS 10.`);
console.log(`✅ Complete! ${modifiedHtml}/${totalHtml} HTML files patched.`);
console.log("==================================================");
