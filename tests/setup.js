/**
 * Jest setup file to polyfill browser APIs required by cheerio/undici
 *
 * Cheerio uses undici for fetch, which relies on browser APIs like File, Blob, etc.
 * These need to be polyfilled in Node.js test environment.
 */

// Polyfill File API for undici
if (typeof global.File === 'undefined') {
  global.File = class File {
    constructor(parts, filename, options = {}) {
      this.parts = parts;
      this.name = filename;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

// Polyfill FormData if needed
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }
    append(key, value) {
      this.data.set(key, value);
    }
    get(key) {
      return this.data.get(key);
    }
  };
}

// Polyfill Headers if needed
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = new Map(Object.entries(init));
    }
    get(key) {
      return this.headers.get(key.toLowerCase());
    }
    set(key, value) {
      this.headers.set(key.toLowerCase(), value);
    }
    has(key) {
      return this.headers.has(key.toLowerCase());
    }
  };
}
