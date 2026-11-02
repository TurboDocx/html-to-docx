// Locks what .oxlintrc.json enforces and how the baseline ratchet behaves. Runs the real oxlint binary,
// config, vendored plugins and scripts/oxlint-baseline.mjs against throwaway projects, because a wrong
// rule name, override or ratchet comparison fails silently: lint just passes.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Jest runs from the repository root (jest.config.js lives there).
const REPO_ROOT = process.cwd();
const OXLINT = path.join(REPO_ROOT, 'node_modules/.bin/oxlint');

const projects = [];

// A throwaway project: the repo's config, plugins, package.json and .gitignore, plus the given files.
const makeProject = ({ files }) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'oxlint-config-'));
  projects.push(dir);
  ['.oxlintrc.json', 'oxlint-plugins', 'package.json', '.gitignore'].forEach((entry) => {
    cpSync(path.join(REPO_ROOT, entry), path.join(dir, entry), { recursive: true });
  });
  writeFileSync(path.join(dir, '.oxlint-baseline.json'), '{}');
  Object.entries(files).forEach(([file, code]) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), code);
  });
  return dir;
};

const lint = ({ dir }) => {
  const { stdout, stderr, status } = spawnSync(OXLINT, ['-f', 'json', '.'], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (status !== 0 && status !== 1) {
    throw new Error(`oxlint exited with status ${status}: ${stderr}`);
  }
  return JSON.parse(stdout).diagnostics;
};

const removeProjects = () => {
  projects.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
};

describe('oxlint config', () => {
  let diagnostics = [];
  const rules = ({ filename }) =>
    diagnostics.filter((d) => d.filename === filename).map((d) => d.code);

  beforeAll(() => {
    const dir = makeProject({
      files: {
        'src/undefinedInit.js':
          'export function pick(x) {\n  let a = undefined;\n  if (x) {\n    return a;\n  }\n  return undefined;\n}\n',
        'src/indexLoop.js':
          'export function sum(arr) {\n  let t = 0;\n  for (let i = 0; i < arr.length; i += 1) {\n    t += arr[i];\n  }\n  return t;\n}\n',
        'src/endlessLoop.js': 'export function spin() {\n  while (true) {\n    break;\n  }\n}\n',
        'src/caught.js':
          'export function parse(text) {\n  try {\n    return JSON.parse(text);\n  } catch (error) {\n    return null;\n  }\n}\n',
        'src/exempted.js':
          '// eslint-disable-next-line eslint-js/consistent-return\nexport function maybe(x) {\n  if (x) {\n    return 1;\n  }\n}\n',
        'src/notExempted.js': 'export function maybe(x) {\n  if (x) {\n    return 1;\n  }\n}\n',
        'src/optional.js':
          "export function load() {\n  // eslint-disable-next-line global-require, import-js/no-extraneous-dependencies\n  const sharp = require('sharp');\n  return sharp;\n}\n",
        'node_modules/sharp/package.json': '{ "name": "sharp", "main": "index.js" }\n',
        'node_modules/sharp/index.js': 'module.exports = {};\n',
        'scripts/commonjs.js':
          "const path = require('path');\n\nfunction helper() {\n  return path.sep;\n}\n\nmodule.exports = { helper };\n",
        'scripts/util.mjs': 'export const u = 1;\n',
        'scripts/withExtension.mjs': "import { u } from './util.mjs';\n\nexport const w = u;\n",
        'scripts/withoutExtension.mjs': "import { u } from './util';\n\nexport const w = u;\n",
      },
    });
    diagnostics = lint({ dir });
  });

  afterAll(removeProjects);

  test('reports `= undefined` through the vendored no-undef-init, not no-useless-undefined', () => {
    const fileRules = rules({ filename: 'src/undefinedInit.js' });
    expect(fileRules).toContain('eslint-js(no-undef-init)');
    expect(fileRules).not.toContain('unicorn(no-useless-undefined)');
  });

  test('does not ask for for..of, which eslint-js/no-restricted-syntax bans', () => {
    expect(rules({ filename: 'src/indexLoop.js' })).not.toContain('typescript(prefer-for-of)');
  });

  test('flags `while (true)` as ESLint 7 did', () => {
    expect(rules({ filename: 'src/endlessLoop.js' })).toContain('eslint(no-constant-condition)');
  });

  test('does not flag an unused catch parameter, as ESLint 7 did not', () => {
    expect(rules({ filename: 'src/caught.js' })).not.toContain('eslint(no-unused-vars)');
  });

  test('honours a disable comment that names a vendored rule', () => {
    expect(rules({ filename: 'src/notExempted.js' })).toContain('eslint-js(consistent-return)');
    expect(rules({ filename: 'src/exempted.js' })).not.toContain('eslint-js(consistent-return)');
  });

  test('gives the same answer for an optional dependency whether or not it is installed', () => {
    const fileRules = rules({ filename: 'src/optional.js' });
    expect(fileRules).not.toContain('import-js(no-extraneous-dependencies)');
    expect(fileRules).not.toContain('node(global-require)');
  });

  test('does not treat top-level declarations in a CommonJS file as globals', () => {
    expect(rules({ filename: 'scripts/commonjs.js' })).not.toContain('eslint(no-implicit-globals)');
  });

  test('requires the extension on a relative import in an .mjs file, as Node ESM does', () => {
    expect(rules({ filename: 'scripts/withExtension.mjs' })).not.toContain('import(extensions)');
    expect(rules({ filename: 'scripts/withoutExtension.mjs' })).toContain('import(extensions)');
  });
});

describe('baseline ratchet (scripts/oxlint-baseline.mjs)', () => {
  // The tests run in order against one project, each starting from the state the previous one left.
  const COUNTS = '.oxlint-baseline-counts.json';
  const LEGACY = 'src/legacy.js';
  const MOVED = 'src/moved.js';
  const STABLE = 'src/stable.js';
  const UNRELATED = 'src/unrelated.js';
  const UGLY = 'src/ugly.js';
  const ONE_LOG = 'export const value = 1;\nconsole.log(value);\n';
  const TWO_LOGS = `${ONE_LOG}console.log(value);\n`;
  const CLEAN = 'export const value = 1;\n';
  let dir = '';
  const counts = () => JSON.parse(readFileSync(path.join(dir, COUNTS), 'utf8'));
  const write = ({ file, code }) => writeFileSync(path.join(dir, file), code);
  const run = ({ command, args }) => spawnSync(command, args, { cwd: dir, encoding: 'utf8' });
  const ratchet = ({ args = [] } = {}) =>
    run({ command: process.execPath, args: ['scripts/oxlint-baseline.mjs', ...args] });
  const check = ({ extra = [] } = {}) => ratchet({ args: ['--check', ...extra] });
  const git = ({ args }) =>
    run({
      command: 'git',
      args: [
        '-c',
        'user.email=t@t',
        '-c',
        'user.name=t',
        '-c',
        'commit.gpgsign=false',
        '-c',
        'core.hooksPath=/dev/null',
        ...args,
      ],
    });

  beforeAll(() => {
    // The repository's config, plugins, script, Prettier settings and package.json, with node_modules
    // linked so the script finds the pinned oxlint and Prettier (.gitignore keeps them out of the lint).
    dir = mkdtempSync(path.join(tmpdir(), 'oxlint-ratchet-'));
    projects.push(dir);
    [
      '.oxlintrc.json',
      'oxlint-plugins',
      'scripts/oxlint-baseline.mjs',
      '.prettierignore',
      '.prettierrc',
      '.gitignore',
      'package.json',
    ].forEach((entry) => {
      cpSync(path.join(REPO_ROOT, entry), path.join(dir, entry), { recursive: true });
    });
    symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(dir, 'node_modules'));
    mkdirSync(path.join(dir, 'src'));
    write({ file: LEGACY, code: ONE_LOG });
    write({ file: STABLE, code: ONE_LOG });
    write({ file: UGLY, code: 'export const ugly  =  1;\n' });
    const created = ratchet({ args: ['--allow-growth'] });
    if (created.status !== 0) {
      throw new Error(`baseline script failed: ${created.stderr}`);
    }
    [
      ['init', '-q'],
      ['add', '-A'],
      ['commit', '-qm', 'base'],
    ].forEach((args) => {
      const result = git({ args });
      if (result.status !== 0) {
        throw new Error(`git ${args[0]} failed: ${result.stderr}`);
      }
    });
  });

  afterAll(removeProjects);

  test('records the exact count per rule and file, and the unformatted files', () => {
    expect(counts()['no-console']).toStrictEqual({ [LEGACY]: 1, [STABLE]: 1 });
    expect(readFileSync(path.join(dir, '.prettier-baseline'), 'utf8')).toContain(`\n${UGLY}\n`);
  });

  test('passes the full and the fast check while nothing grows', () => {
    expect(check().status).toBe(0);
    expect(check({ extra: ['--fast'] }).status).toBe(0);
  });

  test('rejects unknown flags and a regenerate from a partial run', () => {
    expect(ratchet({ args: ['--chek'] }).status).not.toBe(0);
    expect(ratchet({ args: ['--fast'] }).status).not.toBe(0);
    expect(ratchet({ args: [LEGACY] }).status).not.toBe(0);
  });

  test('fails, marking the new line, when a baselined file gains a violation, in the fast check too', () => {
    write({ file: LEGACY, code: TWO_LOGS });
    const result = check();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${LEGACY}: no-console, 2 violation(s) where 1 existed`);
    expect(result.stderr).toContain(`  > ${LEGACY}:3 `);
    expect(check({ extra: ['--fast', path.join(dir, LEGACY)] }).status).toBe(1);
    expect(ratchet().status).toBe(1);
    write({ file: LEGACY, code: ONE_LOG });
  });

  test('fails on a newly unformatted file', () => {
    write({ file: 'src/messy.js', code: 'export const messy  =  1;\n' });
    const result = check();
    rmSync(path.join(dir, 'src/messy.js'));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/messy.js');
  });

  test("keeps a renamed file's allowance, for the counts and the Prettier list", () => {
    git({ args: ['mv', LEGACY, MOVED] });
    git({ args: ['mv', UGLY, 'src/renamed.js'] });
    expect(check().status).toBe(0);
    expect(ratchet().status).toBe(0);
    expect(counts()['no-console']).toStrictEqual({ [MOVED]: 1, [STABLE]: 1 });
    expect(readFileSync(path.join(dir, '.prettier-baseline'), 'utf8')).toContain(
      '\nsrc/renamed.js\n'
    );
  });

  test("does not hand a deleted file's allowance to an unrelated file", () => {
    git({ args: ['rm', '-q', '-f', MOVED] });
    write({ file: UNRELATED, code: ONE_LOG });
    git({ args: ['add', UNRELATED] });
    const result = ratchet();
    git({ args: ['rm', '-q', '-f', UNRELATED] });
    write({ file: MOVED, code: ONE_LOG });
    git({ args: ['add', MOVED] });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${UNRELATED}: no-console, 1 violation(s) where 0 existed`);
  });

  test('fails when .oxlint-baseline.json is edited by hand', () => {
    const baselinePath = path.join(dir, '.oxlint-baseline.json');
    const original = readFileSync(baselinePath, 'utf8');
    const edited = JSON.parse(original);
    edited.overrides.push({ files: ['src/other.js'], rules: { 'no-alert': 'off' } });
    writeFileSync(baselinePath, JSON.stringify(edited));
    const result = check();
    writeFileSync(baselinePath, original);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not match');
  });

  test('only warns about a lower count in a file the change did not touch', () => {
    const countsPath = path.join(dir, COUNTS);
    const original = readFileSync(countsPath, 'utf8');
    const raised = JSON.parse(original);
    raised['no-console'][STABLE] = 3;
    writeFileSync(countsPath, JSON.stringify(raised));
    const result = check();
    writeFileSync(countsPath, original);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('went down elsewhere');
  });

  test('fails until fixes in a touched file are locked in, for the counts and the Prettier list', () => {
    write({ file: MOVED, code: CLEAN });
    write({ file: 'src/renamed.js', code: 'export const ugly = 1;\n' });
    const stale = check();
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain(`${MOVED}: no-console 1 -> 0`);
    expect(stale.stderr).toContain('lists src/renamed.js');
    expect(ratchet().status).toBe(0);
    expect(counts()['no-console']).toStrictEqual({ [STABLE]: 1 });
    expect(check().status).toBe(0);
  });

  test('fails a pull request whose baseline grew against the base branch, unless labeled', () => {
    write({ file: MOVED, code: ONE_LOG });
    write({ file: 'src/renamed.js', code: 'export const ugly  =  1;\n' });
    expect(ratchet({ args: ['--allow-growth'] }).status).toBe(0);
    write({ file: 'src/new-ugly.js', code: 'export const extra  =  1;\n' });
    expect(ratchet({ args: ['--allow-growth'] }).status).toBe(0);
    const result = check({ extra: ['--base', 'HEAD'] });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('grew compared to HEAD');
    expect(result.stderr).toContain('.prettier-baseline src/new-ugly.js');
    expect(check({ extra: ['--base=HEAD', '--allow-base-growth'] }).status).toBe(0);
    rmSync(path.join(dir, 'src/new-ugly.js'));
    expect(ratchet().status).toBe(0);
  });

  test('fails a pull request that changes the lint config or the lint scripts, unless labeled', () => {
    expect(check({ extra: ['--base', 'HEAD'] }).status).toBe(0);
    const configPath = path.join(dir, '.oxlintrc.json');
    const config = readFileSync(configPath, 'utf8');
    writeFileSync(configPath, `${config}\n`);
    const configChanged = check({ extra: ['--base', 'HEAD'] });
    writeFileSync(configPath, config);
    expect(configChanged.status).toBe(1);
    expect(configChanged.stderr).toContain('changed compared to HEAD');
    const packagePath = path.join(dir, 'package.json');
    const pkg = readFileSync(packagePath, 'utf8');
    writeFileSync(packagePath, pkg.replace('--check --fast', '--check'));
    const scriptsChanged = check({ extra: ['--base', 'HEAD'] });
    const labeled = check({ extra: ['--base', 'HEAD', '--allow-base-growth'] });
    writeFileSync(packagePath, pkg);
    expect(scriptsChanged.status).toBe(1);
    expect(labeled.status).toBe(0);
  });

  test('fails loudly on a --base ref the checkout does not have', () => {
    const result = check({ extra: ['--base', 'no-such-ref'] });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('not a commit');
  });
});
