import "../lib/polyfills";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skyfit Pesquisa de Satisfação",
  description: "Totem de pesquisa de satisfação para academia SkyFit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skyfit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-zinc-950`}
      style={{ backgroundColor: "#09090b", color: "#f4f4f5" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Error handler para diagnóstico visual em dispositivos legados (iOS 10)
              window.onerror = function(msg, url, line, col, error) {
                var d = document.getElementById('debug-error-banner');
                if (!d) {
                  d = document.createElement('div');
                  d.id = 'debug-error-banner';
                  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:#ffffff;z-index:999999;padding:12px;font-size:13px;font-family:monospace;word-break:break-all;box-shadow:0 4px 6px rgba(0,0,0,0.5);';
                  if (document.body) { document.body.appendChild(d); }
                  else { document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(d); }); }
                }
                d.textContent = 'Erro [iOS 10]: ' + msg + ' (' + (url ? url.split('/').pop() : 'inline') + ':' + line + ')';
              };
              window.addEventListener('unhandledrejection', function(e) {
                var d = document.getElementById('debug-promise-banner');
                if (!d) {
                  d = document.createElement('div');
                  d.id = 'debug-promise-banner';
                  d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#991b1b;color:#ffffff;z-index:999999;padding:12px;font-size:12px;font-family:monospace;word-break:break-all;';
                  if (document.body) { document.body.appendChild(d); }
                  else { document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(d); }); }
                }
                d.textContent = 'Promise Rejection: ' + (e.reason ? (e.reason.message || e.reason) : 'unknown');
              });

              // Helper global de exclusão segura contra restrições do JavaScriptCore do iOS 10
              // No WebKit do iOS 10, o operador delete em modo estrito dispara TypeError: Unable to delete property
              // ao deletar propriedades não configuráveis em host objects (DOMStringMap/dataset) ou prototypes nativos.
              window.__ios10SafeDelete = function(o, p) {
                if (!o) return true;
                try {
                  return delete o[p];
                } catch (e) {
                  try {
                    if (typeof document !== 'undefined' && o === document.documentElement.dataset && document.documentElement.removeAttribute) {
                      var a = 'data-' + String(p).replace(/([A-Z])/g, '-$1').toLowerCase();
                      document.documentElement.removeAttribute(a);
                    }
                  } catch (e2) {}
                  try { o[p] = undefined; } catch (e3) {}
                  return false;
                }
              };

              // Compatibilidade com WeakMap e WeakSet no iOS 10 (Safari 10)
              // Em versões antigas do WebKit, WeakMap/WeakSet.prototype possuíam método 'clear' nativo
              // com atributo DontDelete (não-configurável). O core-js tenta fazer 'delete NativePrototype.clear'
              // em modo estrito, causando TypeError: Unable to delete property.
              try {
                if (typeof WeakMap !== 'undefined' && WeakMap.prototype && 'clear' in WeakMap.prototype) {
                  try {
                    Object.defineProperty(WeakMap.prototype, 'clear', {
                      value: undefined,
                      writable: true,
                      configurable: true,
                      enumerable: false
                    });
                  } catch (e) {
                    WeakMap.prototype.clear = undefined;
                  }
                }
                if (typeof WeakSet !== 'undefined' && WeakSet.prototype && 'clear' in WeakSet.prototype) {
                  try {
                    Object.defineProperty(WeakSet.prototype, 'clear', {
                      value: undefined,
                      writable: true,
                      configurable: true,
                      enumerable: false
                    });
                  } catch (e) {
                    WeakSet.prototype.clear = undefined;
                  }
                }
              } catch (e) {}

              // Previne erro ao deletar window.next.__internal_src_page ou outras propriedades globais
              if (!window.next) {
                window.next = {};
              }

              // Previne hydration mismatch / crash ao remover dataset.dplId
              try {
                if (document.documentElement && document.documentElement.removeAttribute) {
                  document.documentElement.removeAttribute('data-dpl-id');
                }
              } catch (e) {}

              // Safety net: executa ANTES de qualquer bundle JS carregar.
              // Garante globals mínimos para o parser não crashar no iOS 10.
              if (typeof globalThis === 'undefined') {
                window.globalThis = window;
                self.globalThis = self;
              }
              if (!window.crypto) {
                window.crypto = {};
              }
              if (!window.crypto.randomUUID) {
                window.crypto.randomUUID = function() {
                  if (typeof window.crypto.getRandomValues === 'function') {
                    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, function(c) {
                      var n = Number(c);
                      return (n ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
                    });
                  }
                  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0;
                    var v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                  });
                };
              }
              // Stub mínimo de TextEncoder/TextDecoder para evitar crash antes do polyfill completo
              if (typeof TextEncoder === 'undefined') {
                window.TextEncoder = function TextEncoder() {};
                window.TextEncoder.prototype.encode = function(s) {
                  var arr = [];
                  for (var i = 0; i < s.length; i++) {
                    var c = s.charCodeAt(i);
                    if (c < 128) arr.push(c);
                    else if (c < 2048) { arr.push(192 | (c >> 6)); arr.push(128 | (c & 63)); }
                    else { arr.push(224 | (c >> 12)); arr.push(128 | ((c >> 6) & 63)); arr.push(128 | (c & 63)); }
                  }
                  return new Uint8Array(arr);
                };
              }
              if (typeof TextDecoder === 'undefined') {
                window.TextDecoder = function TextDecoder() {};
                window.TextDecoder.prototype.decode = function(buf) {
                  var arr = new Uint8Array(buf);
                  var out = '';
                  for (var i = 0; i < arr.length; i++) out += String.fromCharCode(arr[i]);
                  return out;
                };
              }
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen w-full overflow-x-hidden overscroll-none flex flex-col bg-zinc-950"
        style={{ backgroundColor: "#09090b", color: "#f4f4f5" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
