import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import cleaner from 'rollup-plugin-cleaner';
import nodePolyfills from 'rollup-plugin-polyfill-node';

import * as meta from './package.json';

const isProduction = process.env.NODE_ENV === 'production';
const browserOnly = process.env.BUILD_TARGET === 'browser';

const banner = `// ${meta.homepage} v${meta.version} Copyright ${new Date().getFullYear()} ${meta.author}`;

// Replace the optional native `sharp` dependency with a null stub in browser
// builds. The IIFE build stubs sharp via output.globals, but that only works for
// iife/umd formats; an ESM output needs a real module to import, so we resolve
// `sharp` to a virtual module that exports null. SVG rasterization (the only
// sharp consumer) then throws its existing "Sharp is not installed" error if
// actually invoked, while basic generation works untouched.
const stubSharpForBrowser = () => ({
  name: 'stub-sharp-for-browser',
  resolveId(source) {
    if (source === 'sharp') return '\0sharp-stub';
    return null;
  },
  load(id) {
    if (id === '\0sharp-stub') return 'export default null;';
    return null;
  },
  // `sharp` is loaded via `require('sharp')` inside a try/catch in an ES module
  // (src/utils/image.js). @rollup/plugin-commonjs leaves try/catch requires in
  // mixed ES modules untransformed (default `ignoreTryCatch`), so `resolveId`
  // above never sees `sharp` and the bare `require('sharp')` survives into the
  // bundle. A downstream bundler (Next.js/webpack) then statically resolves it
  // and pulls in sharp's Node-native deps (detect-libc -> child_process),
  // breaking the browser build. Neutralize the require in our own source so no
  // `sharp` specifier remains for any consumer to follow.
  transform(code, id) {
    if (id.includes('node_modules') || !/require\(\s*(['"])sharp\1\s*\)/.test(code)) {
      return null;
    }
    return { code: code.replace(/require\(\s*(['"])sharp\1\s*\)/g, 'null'), map: null };
  },
});

// Node.js / Library build configuration (ESM and UMD)
const libraryConfig = {
  input: 'index.js',
  external: ['color-name', 'jszip', 'xmlbuilder2', 'html-entities', 'lru-cache', 'htmlparser2', 'sharp'],
  plugins: [
    resolve(),
    json(),
    commonjs(),
    nodePolyfills(),
    terser({
      mangle: false,
    }),
    cleaner({
      targets: ['./dist/'],
    }),
  ],
  output: [
    {
      file: 'dist/html-to-docx.esm.js',
      format: 'es',
      sourcemap: !isProduction,
      banner,
    },
    {
      file: 'dist/html-to-docx.umd.js',
      format: 'umd',
      name: 'HTMLToDOCX',
      sourcemap: !isProduction,
      globals: {
        htmlparser2: 'htmlparser2',
        jszip: 'JSZip',
        xmlbuilder2: 'xmlbuilder2',
        'html-entities': 'htmlEntities',
      },
      banner,
    },
  ],
};

// Standalone browser build configuration (all dependencies bundled)
const browserConfig = {
  input: 'index.js',
  // Only exclude sharp (Node.js native module, not supported in browser)
  external: ['sharp'],
  plugins: [
    // Only clean when building browser-only (cleaner already runs in libraryConfig for full builds)
    ...(browserOnly ? [cleaner({ targets: ['./dist/'] })] : []),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    json(),
    commonjs(),
    nodePolyfills(),
    terser({
      mangle: isProduction,
      compress: isProduction,
    }),
  ],
  output: {
    file: 'dist/html-to-docx.browser.js',
    format: 'iife',
    name: 'HTMLToDOCX',
    sourcemap: !isProduction,
    banner,
    // Provide empty implementation for sharp in browser environment
    globals: {
      sharp: '(() => null)',
    },
  },
};

// Browser ESM build: same self-contained, polyfilled bundle as the IIFE, but
// emitted as an ES module with a real default export. This is what bundlers
// (Next.js, Vite, webpack) resolve via the package `exports` "browser"
// condition, so `import HTMLtoDOCX from '@turbodocx/html-to-docx'` works with no
// extra configuration. `sharp` is replaced by a null stub (see above).
const browserEsmConfig = {
  input: 'index.js',
  plugins: [
    stubSharpForBrowser(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    json(),
    commonjs(),
    nodePolyfills(),
    terser({
      mangle: isProduction,
      compress: isProduction,
    }),
  ],
  output: {
    file: 'dist/html-to-docx.browser.esm.js',
    format: 'es',
    sourcemap: !isProduction,
    banner,
  },
};

const configs = [libraryConfig, browserConfig, browserEsmConfig];

export default browserOnly ? [browserConfig, browserEsmConfig] : configs;
