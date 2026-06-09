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

// Node.js / Library build configuration (ESM and UMD)
const libraryConfig = {
  input: 'index.js',
  external: [
    'color-name',
    'jszip',
    'xmlbuilder2',
    'html-entities',
    'lru-cache',
    'htmlparser2',
    'sharp',
    // CSS stylesheet resolver deps. Externalized (like htmlparser2 et al.) so
    // they are required from node_modules at runtime — css-tree loads JSON data
    // files (data/patch.json, mdn-data) that cannot be inlined into the bundle.
    'css-select',
    'css-tree',
    'domutils',
  ],
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
        'css-select': 'cssSelect',
        'css-tree': 'csstree',
        domutils: 'domutils',
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

const configs = [libraryConfig, browserConfig];

export default browserOnly ? [browserConfig] : configs;
