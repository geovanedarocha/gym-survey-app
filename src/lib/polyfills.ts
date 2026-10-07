/* eslint-disable */
// ─────────────────────────────────────────────────────────────────────────────
// Polyfills para compatibilidade com iOS 10.3.4 / Safari 10.0 (WebKit legado)
// IMPORTANTE: Este ficheiro é importado via instrumentation-client.ts, que
// executa ANTES do React hidratar. A ordem dos imports é crítica.
// ─────────────────────────────────────────────────────────────────────────────

// 0. Safeguard global para WebKit / iOS 10 contra "TypeError: Unable to delete property"
if (typeof window !== "undefined") {
  (window as any).__ios10SafeDelete =
    (window as any).__ios10SafeDelete ||
    function (o: any, p: any) {
      if (!o) return true;
      try {
        return delete o[p];
      } catch (e) {
        try {
          if (
            typeof document !== "undefined" &&
            o === document.documentElement?.dataset &&
            document.documentElement?.removeAttribute
          ) {
            const a = "data-" + String(p).replace(/([A-Z])/g, "-$1").toLowerCase();
            document.documentElement.removeAttribute(a);
          }
        } catch (e2) {}
        try {
          o[p] = undefined;
        } catch (e3) {}
        return false;
      }
    };

  // WeakMap/WeakSet no WebKit iOS 10 tinham 'clear' nativo com DontDelete (não configurável).
  // O core-js/internals/collection tenta deletá-lo em modo estrito, lançando TypeError.
  try {
    if (typeof WeakMap !== "undefined" && WeakMap.prototype && "clear" in WeakMap.prototype) {
      try {
        Object.defineProperty(WeakMap.prototype, "clear", {
          value: undefined,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } catch (e) {
        (WeakMap.prototype as any).clear = undefined;
      }
    }
    if (typeof WeakSet !== "undefined" && WeakSet.prototype && "clear" in WeakSet.prototype) {
      try {
        Object.defineProperty(WeakSet.prototype, "clear", {
          value: undefined,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } catch (e) {
        (WeakSet.prototype as any).clear = undefined;
      }
    }
  } catch (e) {}

  if (!(window as any).next) {
    (window as any).next = {};
  }
}

// 1. Core JS polyfills (ES6–ES2023 built-ins: Promise, Symbol, Array.from, etc.)
require("core-js/stable");
require("regenerator-runtime/runtime");

// 2. Ensure globalThis exists in iOS 10.3 / older WebKit
if (typeof globalThis === "undefined") {
  (function () {
    if (typeof self !== "undefined") {
      (self as any).globalThis = self;
    } else if (typeof window !== "undefined") {
      (window as any).globalThis = window;
    } else if (typeof global !== "undefined") {
      (global as any).globalThis = global;
    }
  })();
}

// 3. Polyfills que dependem de globalThis/window — apenas no cliente
if (typeof window !== "undefined") {

  // ── fetch API (whatwg-fetch) ─────────────────────────────────────────────
  // O Safari 10 tem um fetch nativo parcialmente funcional. O whatwg-fetch
  // sobrescreve apenas se necessário (detecção interna). Garante Headers,
  // Request, Response completos.
  require("whatwg-fetch");

  // ── TextEncoder / TextDecoder (fast-text-encoding) ──────────────────────
  // Indispensável para Firebase Auth, Firestore serialization e Google
  // Generative AI SDK. O Safari 10 não tem suporte nativo.
  if (typeof window.TextEncoder === "undefined" || typeof window.TextDecoder === "undefined") {
    require("fast-text-encoding");
  }

  // ── AbortController / AbortSignal ───────────────────────────────────────
  // Necessário para fetch com timeout e cancelamento. Safari 10 não suporta.
  if (typeof window.AbortController === "undefined") {
    require("abortcontroller-polyfill/dist/polyfill-patch-fetch");
  }

  // ── ReadableStream / WritableStream / TransformStream ───────────────────
  // Necessário para streaming do Firebase e potencialmente o Gemini SDK.
  // Safari 10 não suporta Web Streams API.
  if (typeof window.ReadableStream === "undefined") {
    const streams = require("web-streams-polyfill/dist/ponyfill.js");
    window.ReadableStream = streams.ReadableStream;
    window.WritableStream = streams.WritableStream;
    window.TransformStream = streams.TransformStream;
  }

  // ── ResizeObserver ──────────────────────────────────────────────────────
  if (!window.ResizeObserver) {
    try {
      const ResizeObserverPolyfill = require("resize-observer-polyfill");
      window.ResizeObserver = ResizeObserverPolyfill.default || ResizeObserverPolyfill;
    } catch (e) {
      console.warn("ResizeObserver polyfill could not be loaded", e);
    }
  }

  // ── IntersectionObserver ────────────────────────────────────────────────
  if (!("IntersectionObserver" in window)) {
    try {
      require("intersection-observer");
    } catch (e) {
      console.warn("IntersectionObserver polyfill could not be loaded", e);
    }
  }

  // ── crypto.randomUUID ───────────────────────────────────────────────────
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      if (typeof window.crypto.getRandomValues === "function") {
        return ("10000000-1000-4000-8000-100000000000" as any).replace(
          /[018]/g,
          (c: string) => {
            const n = Number(c);
            return (
              n ^
              (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))
            ).toString(16);
          }
        );
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as any;
    };
  }

  // ── queueMicrotask ──────────────────────────────────────────────────────
  if (typeof window.queueMicrotask !== "function") {
    window.queueMicrotask = function (callback: () => void) {
      Promise.resolve()
        .then(callback)
        .catch((err) =>
          setTimeout(() => {
            throw err;
          }, 0)
        );
    };
  }

  // ── CustomEvent constructor ─────────────────────────────────────────────
  if (typeof (window as any).CustomEvent !== "function") {
    function CustomEvent(event: string, params: any) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    CustomEvent.prototype = (window as any).Event.prototype;
    (window as any).CustomEvent = CustomEvent;
  }

  // ── String.prototype.replaceAll ─────────────────────────────────────────
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (str: any, newSubstr: any): string {
      if (Object.prototype.toString.call(str).toLowerCase() === "[object regexp]") {
        return this.replace(str, newSubstr);
      }
      return this.replace(new RegExp(String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newSubstr);
    };
  }

  // ── Object.fromEntries ──────────────────────────────────────────────────
  if (!Object.fromEntries) {
    Object.fromEntries = function (entries: any): any {
      if (!entries || !entries[Symbol.iterator]) {
        throw new TypeError("Object.fromEntries() requires a single iterable argument");
      }
      const obj: any = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return obj;
    };
  }

  // ── Array.prototype.flat / flatMap ──────────────────────────────────────
  if (!Array.prototype.flat) {
    (Array.prototype as any).flat = function (depth: number = 1): any[] {
      return (function flatDeep(arr: any[], d: number): any[] {
        return d > 0
          ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
          : arr.slice();
      })(this as any, depth);
    };
  }

  if (!Array.prototype.flatMap) {
    (Array.prototype as any).flatMap = function (callback: any, thisArg?: any): any[] {
      return (Array.prototype as any).map.call(this, callback, thisArg).flat(1);
    };
  }

  // ── Array.prototype.at ──────────────────────────────────────────────────
  if (!Array.prototype.at) {
    (Array.prototype as any).at = function (index: number): any {
      const len = this.length;
      const i = index >= 0 ? index : len + index;
      if (i < 0 || i >= len) return undefined;
      return this[i];
    };
  }

  // ── Object.hasOwn ──────────────────────────────────────────────────────
  if (!Object.hasOwn) {
    (Object as any).hasOwn = function (obj: any, prop: PropertyKey): boolean {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }

  // ── structuredClone (basic fallback) ────────────────────────────────────
  if (typeof (window as any).structuredClone !== "function") {
    (window as any).structuredClone = function <T>(val: T): T {
      return JSON.parse(JSON.stringify(val));
    };
  }

  // ── BroadcastChannel safe fallback mock ─────────────────────────────────
  if (typeof (window as any).BroadcastChannel === "undefined") {
    class MockBroadcastChannel {
      name: string;
      onmessage: ((event: any) => void) | null = null;
      constructor(name: string) {
        this.name = name;
      }
      postMessage(_data: any) {}
      close() {}
      addEventListener(_event: string, _callback: any) {}
      removeEventListener(_event: string, _callback: any) {}
    }
    (window as any).BroadcastChannel = MockBroadcastChannel;
  }
}
