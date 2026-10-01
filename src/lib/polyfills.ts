// Core JS polyfills
import "core-js/stable";
import "regenerator-runtime/runtime";

// Ensure globalThis exists in iOS 10.3 / older WebKit
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

// Client-only polyfills
if (typeof window !== "undefined") {
  // ResizeObserver Polyfill
  if (!window.ResizeObserver) {
    try {
      const ResizeObserverPolyfill = require("resize-observer-polyfill");
      window.ResizeObserver = ResizeObserverPolyfill.default || ResizeObserverPolyfill;
    } catch (e) {
      console.warn("ResizeObserver polyfill could not be loaded", e);
    }
  }

  // IntersectionObserver Polyfill
  if (!("IntersectionObserver" in window)) {
    try {
      require("intersection-observer");
    } catch (e) {
      console.warn("IntersectionObserver polyfill could not be loaded", e);
    }
  }

  // crypto.randomUUID Polyfill
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

  // queueMicrotask Polyfill
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

  // CustomEvent constructor Polyfill for older Safari
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

  // String.prototype.replaceAll fallback
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (str: any, newSubstr: any): string {
      if (Object.prototype.toString.call(str).toLowerCase() === "[object regexp]") {
        return this.replace(str, newSubstr);
      }
      return this.replace(new RegExp(String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newSubstr);
    };
  }

  // Object.fromEntries fallback
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

  // Array.prototype.flat / flatMap fallback
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

  // BroadcastChannel safe fallback mock to avoid crashes in older WebKit
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
