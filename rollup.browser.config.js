/**
 * Rollup configuration - Browser standalone build only
 * 
 * This configuration bundles all dependencies into a single file
 * that can be used directly in browsers without any additional libraries
 */
import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import nodePolyfills from 'rollup-plugin-polyfill-node';

import * as meta from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const banner = `// ${meta.homepage} v${meta.version} Copyright ${new Date().getFullYear()} ${meta.author}`;

// Standalone browser build configuration (all dependencies bundled)
export default {
  input: 'index.js',
  // Only exclude sharp (Node.js native module, not supported in browser)
  external: ['sharp'],
  plugins: [
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
    globals: {
      sharp: '(() => null)',
    },
  },
};
