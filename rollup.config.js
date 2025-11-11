import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import cleaner from 'rollup-plugin-cleaner';
import builtins from 'rollup-plugin-node-builtins';

import * as meta from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'index.js',
  external: ['color-name', 'jszip', 'xmlbuilder2', 'html-entities', 'lru-cache', 'htmlparser2', 'sharp'],
  plugins: [
    resolve(),
    json(),
    commonjs(),
    builtins(),
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
      banner: `// ${meta.homepage} v${meta.version} Copyright ${new Date().getFullYear()} ${
        meta.author
      }`,
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
      banner: `// ${meta.homepage} v${meta.version} Copyright ${new Date().getFullYear()} ${
        meta.author
      }`,
    },
  ],
};
