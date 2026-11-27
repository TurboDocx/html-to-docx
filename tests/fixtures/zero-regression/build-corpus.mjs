#!/usr/bin/env node
/**
 * Builds tests/fixtures/zero-regression/corpus.json, the HTML the zero-regression suite renders
 * with 1.23.3 and with this branch. Re-run it only on purpose: the corpus is frozen so the suite
 * keeps checking the same documents.
 *
 *   node tests/fixtures/zero-regression/build-corpus.mjs
 *
 * Sources:
 *   - every call each example/*.js script makes to HTMLtoDOCX (the converter is stubbed, nothing is
 *     written), with its header and footer HTML and its options;
 *   - every HTML string literal in the test files as they stood on `develop` before the document
 *     editor work (BASE_REF), parsed, not run.
 * Remote images are swapped for an inline 1x1 PNG so the suite never touches the network.
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { promisify } from 'node:util';
import vm from 'node:vm';

import { parse } from '@babel/parser';

const run = promisify(execFile);
const noop = () => {};
const ROOT = path.resolve(import.meta.dirname, '../../..');
const OUT = path.join(ROOT, 'tests/fixtures/zero-regression/corpus.json');
// develop before the document editor work (TurboDocx/html-to-docx#256): the tests 1.23.3 shipped with.
const BASE_REF = '9a466bb2b89be69f929ebad2ab32b1baa4d2dfa4';

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const offline = (html) =>
  typeof html === 'string'
    ? html.replaceAll(/(src\s*=\s*["'])https?:\/\/[^"']*(["'])/gi, `$1${PIXEL}$2`)
    : null;

// ES module examples run as scripts once their default imports become requires.
const asScript = (source) =>
  source.replaceAll(/^import (\w+) from ['"]([^'"]+)['"];?$/gm, "const $1 = require('$2');");

const runExample = async (file) => {
  const calls = [];
  const stub = (...args) => {
    const [html, headerHTML, options, footerHTML] = args;
    calls.push({ html, headerHTML, options, footerHTML });
    return Promise.resolve(Buffer.alloc(0));
  };
  const fakeFs = new Proxy({}, { get: () => noop });
  const sandbox = {
    require: (id) => (id === 'fs' ? fakeFs : stub),
    console: { log: noop, error: noop, warn: noop },
    process: { ...process, exit: noop },
    Buffer,
    setTimeout,
    module: { exports: {} },
  };
  const source = asScript(await readFile(path.join(ROOT, 'example', file), 'utf8'));
  vm.runInNewContext(source, sandbox, { filename: file });
  // Each example converts inside an async function; give it a turn to make its calls.
  await wait(50);
  return calls.map((call, index) => ({
    name: `example/${file}#${index}`,
    html: offline(call.html),
    headerHTML: offline(call.headerHTML),
    footerHTML: offline(call.footerHTML),
    options: call.options || {},
  }));
};

const fromExamples = async () => {
  const all = await readdir(path.join(ROOT, 'example'));
  const files = all.filter((file) => file.endsWith('.js')).toSorted();
  const entries = await Promise.all(files.map((file) => runExample(file)));
  return entries.flat();
};

const valueOf = (node, constants) => {
  if (!node) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type !== 'TemplateLiteral') return null;
  const parts = node.quasis.map((quasi, index) => {
    const expression = node.expressions[index];
    if (!expression) return quasi.value.cooked;
    if (expression.type !== 'Identifier' || !constants.has(expression.name)) return null;
    return quasi.value.cooked + constants.get(expression.name);
  });
  return parts.includes(null) ? null : parts.join('');
};

const isHtml = (value) =>
  /^\s*</.test(value) &&
  /<\/?[a-z][a-z0-9]*[\s>/]/i.test(value) &&
  !/^\s*<\?xml/.test(value) &&
  !/^\s*<w:/.test(value);

const childrenOf = (node) =>
  Object.entries(node)
    .filter(([key]) => key !== 'loc' && key !== 'start' && key !== 'end')
    .flatMap(([, child]) => (Array.isArray(child) ? child : [child]))
    .filter((child) => child && typeof child.type === 'string');

// Every HTML string or template literal in a test file, with `${CONST}` filled from its string constants.
const htmlLiteralsOf = (source) => {
  const constants = new Map();
  const found = [];
  const walk = (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      const value = valueOf(node.init, constants);
      if (value !== null) constants.set(node.id.name, value);
    }
    if (node.type === 'StringLiteral' || node.type === 'TemplateLiteral') {
      const value = valueOf(node, constants);
      if (value && isHtml(value)) found.push(value);
    }
    childrenOf(node).forEach((child) => walk(child));
  };
  walk(parse(source, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true }).program);
  return [...new Set(found)];
};

const fromDevelopTests = async () => {
  const { stdout } = await run('git', ['ls-tree', '--name-only', `${BASE_REF}:tests`], {
    cwd: ROOT,
  });
  const names = stdout
    .split('\n')
    .filter((name) => name.endsWith('.test.js'))
    .toSorted();
  const sources = await Promise.all(
    names.map((name) =>
      run('git', ['show', `${BASE_REF}:tests/${name}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
    )
  );
  return names.flatMap((name, index) =>
    htmlLiteralsOf(sources[index].stdout).map((value, position) => ({
      name: `tests/${name}#${position}`,
      html: offline(value),
    }))
  );
};

const main = async () => {
  try {
    const entries = [...(await fromExamples()), ...(await fromDevelopTests())];
    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, `${JSON.stringify({ base: BASE_REF, entries }, null, 2)}\n`);
    process.stdout.write(`${entries.length} entries written to ${path.relative(ROOT, OUT)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  }
};

main();
