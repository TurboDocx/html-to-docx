// Ratchet for lint and formatting problems that predate a rule. Generated files, all committed:
//
//   .oxlint-baseline-counts.json  For each rule and file, how many violations exist. This is the ratchet.
//   .oxlint-baseline.json         Derived from the counts: exempts each listed file from that rule so
//                                 editors stay quiet about old code. .oxlintrc.json extends it.
//   .prettier-baseline            The files Prettier would still reformat. `npm run prettier:check` uses it
//                                 as its ignore file, so it starts with everything .prettierignore skips.
//
//   node scripts/oxlint-baseline.mjs --check --fast [files...]
//       `npm run lint` and the pre-commit hook: lint only, exact per rule and file.
//   node scripts/oxlint-baseline.mjs --check [--base <ref>] [--allow-base-growth]
//       CI: fails on a count that went up or a newly unformatted file, on fixes not locked in yet (a lower
//       count, or a listed file that is now formatted or gone) in files this change touched, and on a
//       .oxlint-baseline.json that does not match the counts. With --base it also fails when the lists
//       grew, or the lint rules changed (.oxlintrc.json, oxlint-plugins/, this script, the lint scripts in
//       package.json), compared to <ref>, unless --allow-base-growth is passed (CI passes it for a pull
//       request labeled lint-baseline-growth).
//   node scripts/oxlint-baseline.mjs [--allow-growth]
//       After fixing problems: rewrite all three files from a full run. Refuses to grow them unless
//       --allow-growth, which is only for a newly enabled rule. A file git sees as renamed (git mv) keeps
//       its allowance.
import { execFile } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';

const CONFIG = '.oxlintrc.json';
const BASELINE = '.oxlint-baseline.json';
const COUNTS = '.oxlint-baseline-counts.json';
const PLUGINS = 'oxlint-plugins';
const SCRIPT = 'scripts/oxlint-baseline.mjs';
const PRETTIER_IGNORE = '.prettierignore';
const PRETTIER_BASELINE = '.prettier-baseline';
const PRETTIER_HEADER = '# Not yet formatted, see scripts/oxlint-baseline.mjs';
const PRETTIER_GLOB = '**/*.js';
const LINT_PATHS = ['.'];
const LABEL = 'lint-baseline-growth';
const EXTENDS_LINE = /^[ \t]*"extends": \["\.\/\.oxlint-baseline\.json"\],\r?\n/mu;
// Large enough for the JSON report of an unbaselined run over the whole repository.
const MAX_BUFFER = 1024 ** 3;
const MAX_UNCHANGED_SHOWN = 5;
const MAX_FIXED_SHOWN = 20;

// Diagnostic scopes that differ from the config's rule prefixes.
const SCOPES = new Map([
  ['eslint', ''],
  ['next', 'nextjs'],
  ['react-hooks', 'react'],
]);

const { values: options, positionals } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    fast: { type: 'boolean', default: false },
    base: { type: 'string' },
    'allow-growth': { type: 'boolean', default: false },
    'allow-base-growth': { type: 'boolean', default: false },
  },
  allowPositionals: true,
  strict: true,
});
const baseRef = options.base ?? null;
const diffRef = baseRef ?? 'HEAD';
const toRepoPath = ({ file }) =>
  path.relative(process.cwd(), path.resolve(file)).split(path.sep).join('/');
const files = positionals.map((file) => toRepoPath({ file }));
if (!options.check && (options.fast || files.length > 0)) {
  throw new Error('Regenerating needs a full run: drop --fast and the file arguments');
}

// The pinned local binaries, run with this Node: npx is not on PATH without a shell on Windows, and with
// no local install it would fetch whatever version is newest.
const requireHere = createRequire(path.join(process.cwd(), 'package.json'));
const binaryOf = ({ pkg }) => {
  const manifestPath = requireHere.resolve(`${pkg}/package.json`);
  const { bin } = requireHere(manifestPath);
  return path.join(path.dirname(manifestPath), typeof bin === 'string' ? bin : bin[pkg]);
};
const OXLINT = binaryOf({ pkg: 'oxlint' });
const PRETTIER = binaryOf({ pkg: 'prettier' });

const execFileAsync = promisify(execFile);

// Runs a command and returns its output and exit status. Linters and git exit non-zero to report
// findings, which callers inspect; only a command that cannot start is an error here.
const run = async ({ command, commandArgs }) => {
  try {
    const { stdout, stderr } = await execFileAsync(command, commandArgs, { maxBuffer: MAX_BUFFER });
    return { stdout, stderr, status: 0 };
  } catch (error) {
    if (typeof error.code !== 'number') {
      throw error;
    }
    return { stdout: error.stdout, stderr: error.stderr, status: error.code };
  }
};
const git = ({ gitArgs }) => run({ command: 'git', commandArgs: gitArgs });
const node = ({ binary, binaryArgs }) =>
  run({ command: process.execPath, commandArgs: [binary, ...binaryArgs] });
const linesOf = ({ text }) => text.split(/\r?\n/u).filter(Boolean);

// Lint as if nothing were baselined, through a per-process copy of the config without the baseline, so
// the committed files are never touched and concurrent runs do not share a temp file.
const lintUnbaselined = async ({ lintArgs }) => {
  const config = await readFile(CONFIG, 'utf8');
  if (!EXTENDS_LINE.test(config)) {
    throw new Error(`${CONFIG} must extend ./${BASELINE} on its own line`);
  }
  const tempConfig = `.oxlintrc.unbaselined-${process.pid}.json`;
  await writeFile(tempConfig, config.replace(EXTENDS_LINE, ''));
  try {
    const { stdout, stderr, status } = await node({
      binary: OXLINT,
      binaryArgs: ['-c', tempConfig, '-f', 'json', '--no-error-on-unmatched-pattern', ...lintArgs],
    });
    let report = null;
    try {
      report = JSON.parse(stdout);
    } catch {
      // oxlint printed an error instead of a report; it is shown below.
    }
    if (!report || (status !== 0 && status !== 1)) {
      throw new Error(`oxlint failed (exit ${status}):\n${stdout}\n${stderr}`.trim());
    }
    return report.diagnostics.map(({ code, message, labels, filename }) => ({
      code,
      message,
      labels,
      filename: toRepoPath({ file: filename }),
    }));
  } finally {
    await rm(tempConfig, { force: true });
  }
};

// "eslint(no-console)" -> "no-console"; "import-js(order)" -> "import-js/order"
const ruleName = ({ diagnostic }) => {
  const match = /^(?<scope>.+?)\((?<rule>.+)\)$/u.exec(diagnostic.code ?? '');
  if (!match) {
    return null;
  }
  const { scope, rule } = match.groups;
  const prefix = SCOPES.get(scope) ?? scope;
  return prefix ? `${prefix}/${rule}` : rule;
};

const lineOf = ({ diagnostic }) => diagnostic.labels?.[0]?.span?.line ?? 0;

const countViolations = ({ diagnostics }) => {
  const counts = {};
  diagnostics.forEach((diagnostic) => {
    const rule = ruleName({ diagnostic });
    counts[rule] ??= {};
    counts[rule][diagnostic.filename] = (counts[rule][diagnostic.filename] ?? 0) + 1;
  });
  return counts;
};

// Files git sees as renamed or moved since `ref` (staged or committed): new path -> old path.
const renamesSince = async ({ ref }) => {
  const { stdout, status } = await git({
    gitArgs: ['diff', '-M', '--name-status', '--no-color', ref],
  });
  if (status !== 0) {
    return new Map();
  }
  const renamed = linesOf({ text: stdout })
    .filter((line) => line.startsWith('R'))
    .map((line) => line.split('\t'));
  return new Map(renamed.map(([, from, to]) => [to, from]));
};

// Every rule and file whose count in `current` is above the one in `allowed`. A renamed file keeps the
// allowance of its old path, as long as the old path no longer has violations of its own.
const findGrowth = ({ current, allowed, renames }) =>
  Object.entries(current).flatMap(([rule, counts]) => {
    const previous = allowed[rule] ?? {};
    return Object.entries(counts).flatMap(([file, count]) => {
      const from = renames.get(file);
      const inherited = from && !(from in counts) ? previous[from] ?? 0 : 0;
      const allowance = (previous[file] ?? 0) + inherited;
      return count > allowance ? [{ rule, file, count, allowed: allowance }] : [];
    });
  });

// Every rule and file whose count went down without the counts file being updated.
const findFixed = ({ current, committed }) =>
  Object.entries(committed).flatMap(([rule, counts]) =>
    Object.entries(counts)
      .filter(([file, count]) => (current[rule]?.[file] ?? 0) < count)
      .map(([file, count]) => ({ rule, file, count: current[rule]?.[file] ?? 0, committed: count }))
  );

// Files added, changed, renamed or deleted since `ref`, untracked files included.
const changedFilesSince = async ({ ref }) => {
  const [tracked, untracked] = await Promise.all([
    git({ gitArgs: ['diff', '--name-only', '--no-color', ref] }),
    git({ gitArgs: ['ls-files', '--others', '--exclude-standard'] }),
  ]);
  return new Set([...linesOf({ text: tracked.stdout }), ...linesOf({ text: untracked.stdout })]);
};

// Lines added or changed since `ref` (null when git cannot say, which marks every line as new).
const changedLines = async ({ file, ref }) => {
  const { stdout, status } = await git({ gitArgs: ['diff', '-U0', '--no-color', ref, '--', file] });
  if (status !== 0) {
    return null;
  }
  if (!stdout) {
    const tracked = await git({ gitArgs: ['ls-files', '--error-unmatch', file] });
    if (tracked.status !== 0) {
      return null;
    }
  }
  const hunks = [...stdout.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gmu)];
  return new Set(
    hunks.flatMap(([, start, length = '1']) =>
      Array.from({ length: Number(length) }, (_, offset) => Number(start) + offset)
    )
  );
};

const printGrowth = async ({ growth, diagnostics, ref }) => {
  const growthFiles = [...new Set(growth.map(({ file }) => file))];
  const changed = await Promise.all(growthFiles.map((file) => changedLines({ file, ref })));
  const linesByFile = new Map(growthFiles.map((file, index) => [file, changed[index]]));
  growth.forEach(({ rule, file, count, allowed }) => {
    process.stderr.write(`${file}: ${rule}, ${count} violation(s) where ${allowed} existed\n`);
    const lines = linesByFile.get(file);
    const isNew = ({ diagnostic }) => lines === null || lines.has(lineOf({ diagnostic }));
    const found = diagnostics.filter(
      (diagnostic) => diagnostic.filename === file && ruleName({ diagnostic }) === rule
    );
    found
      .filter((diagnostic) => isNew({ diagnostic }))
      .forEach((diagnostic) => {
        process.stderr.write(`  > ${file}:${lineOf({ diagnostic })} ${diagnostic.message}\n`);
      });
    const unchanged = found.filter((diagnostic) => !isNew({ diagnostic }));
    unchanged.slice(0, MAX_UNCHANGED_SHOWN).forEach((diagnostic) => {
      process.stderr.write(`    ${file}:${lineOf({ diagnostic })} ${diagnostic.message}\n`);
    });
    if (unchanged.length > MAX_UNCHANGED_SHOWN) {
      process.stderr.write(
        `    ...and ${
          unchanged.length - MAX_UNCHANGED_SHOWN
        } more on lines this change did not touch\n`
      );
    }
  });
};

const sumOf = ({ numbers }) => numbers.reduce((sum, n) => sum + n, 0);
const total = ({ counts }) =>
  sumOf({
    numbers: Object.values(counts).map((perFile) => sumOf({ numbers: Object.values(perFile) })),
  });

// Stable key order so a regenerated file only differs where the violations did.
const sortDeep = ({ value }) =>
  Object.fromEntries(
    Object.keys(value)
      .toSorted()
      .map((key) => [
        key,
        typeof value[key] === 'object' ? sortDeep({ value: value[key] }) : value[key],
      ])
  );

// Baseline paths are globs in the config, so escape every glob metacharacter.
const escapeGlob = ({ file }) => file.replaceAll(/[[\]{}?*\\]/gu, String.raw`\$&`);

const baselineFor = ({ counts }) => ({
  overrides: Object.keys(counts)
    .toSorted()
    .map((rule) => ({
      files: Object.keys(counts[rule])
        .toSorted()
        .map((file) => escapeGlob({ file })),
      rules: { [rule]: 'off' },
    })),
});

// The package.json entries that decide how lint runs.
const lintScripts = ({ packageJson }) => {
  const { scripts = {}, 'lint-staged': lintStaged = null } = JSON.parse(packageJson);
  const entries = Object.entries(scripts)
    .filter(([name]) => /^(?:pre|post)?(?:lint|prettier|validate)/u.test(name))
    .toSorted(([a], [b]) => a.localeCompare(b));
  return JSON.stringify({ scripts: entries, lintStaged });
};

const lintRulesChangedSince = async ({ ref }) => {
  const sources = await git({ gitArgs: ['diff', '--quiet', ref, '--', CONFIG, PLUGINS, SCRIPT] });
  if (sources.status !== 0) {
    return true;
  }
  const before = await git({ gitArgs: ['show', `${ref}:package.json`] });
  if (before.status !== 0) {
    return true;
  }
  const now = await readFile('package.json', 'utf8');
  return lintScripts({ packageJson: before.stdout }) !== lintScripts({ packageJson: now });
};

// The files listed in a .prettier-baseline text, after its header line.
const parsePrettierBaseline = ({ text }) => {
  const lines = text.split(/\r?\n/u).map((line) => line.trim());
  const start = lines.indexOf(PRETTIER_HEADER);
  return start === -1 ? [] : lines.slice(start + 1).filter(Boolean);
};

const readOptional = async ({ file }) => {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

// What the committed lists held at `ref`, or null when the baseline did not exist there yet.
const committedAt = async ({ ref }) => {
  const exists = await git({ gitArgs: ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`] });
  if (exists.status !== 0) {
    throw new Error(`--base ${ref} is not a commit this checkout has; fetch it first`);
  }
  const counts = await git({ gitArgs: ['show', `${ref}:${COUNTS}`] });
  if (counts.status !== 0) {
    return null;
  }
  const prettier = await git({ gitArgs: ['show', `${ref}:${PRETTIER_BASELINE}`] });
  return {
    counts: JSON.parse(counts.stdout),
    unformatted: prettier.status === 0 ? parsePrettierBaseline({ text: prettier.stdout }) : [],
  };
};

// The files Prettier would reformat, ignoring only what .prettierignore ignores.
const listUnformatted = async () => {
  const { stdout, stderr, status } = await node({
    binary: PRETTIER,
    binaryArgs: ['--list-different', '--ignore-path', PRETTIER_IGNORE, PRETTIER_GLOB],
  });
  if (status !== 0 && status !== 1) {
    throw new Error(`prettier failed (exit ${status}):\n${stdout}\n${stderr}`.trim());
  }
  return linesOf({ text: stdout }).toSorted();
};

// Unformatted files the committed list does not cover; a renamed listed file is not new.
const newUnformatted = ({ unformatted, listed, renames }) =>
  unformatted.filter((file) => !listed.includes(file) && !listed.includes(renames.get(file)));

const checkFixes = async ({ current, committed, unformatted, failures }) => {
  // Enforced for files this change touched. Elsewhere a count can drop with no edit (two merged fixes to
  // one file), and a later change should not fail for that.
  const touched = await changedFilesSince({ ref: diffRef });
  const fixed = findFixed({ current, committed: committed.counts });
  const fixedHere = fixed.filter(({ file }) => touched.has(file));
  const formattedHere = committed.unformatted.filter(
    (file) => !unformatted.includes(file) && touched.has(file)
  );
  if (fixedHere.length > 0 || formattedHere.length > 0) {
    process.stderr.write(
      '\nFixed since the baseline. Run npm run lint:baseline to lock the fixes in:\n'
    );
    fixedHere.slice(0, MAX_FIXED_SHOWN).forEach(({ rule, file, count, committed: was }) => {
      process.stderr.write(`  ${file}: ${rule} ${was} -> ${count}\n`);
    });
    formattedHere.forEach((file) => {
      process.stderr.write(`  ${PRETTIER_BASELINE} lists ${file}, which is formatted or gone\n`);
    });
    failures.push('fixes not locked in');
  } else if (fixed.length > 0) {
    process.stdout.write(
      `${fixed.length} rule/file count(s) went down elsewhere; npm run lint:baseline would lock them in.\n`
    );
  }
  const baseline = JSON.parse(await readFile(BASELINE, 'utf8'));
  if (JSON.stringify(baselineFor({ counts: committed.counts })) !== JSON.stringify(baseline)) {
    process.stderr.write(
      `\n${BASELINE} does not match ${COUNTS}. Run npm run lint:baseline; do not edit either by hand.\n`
    );
    failures.push('baseline mismatch');
  }
};

const checkBase = async ({ committed, renames, failures }) => {
  const base = await committedAt({ ref: baseRef });
  if (!base) {
    return;
  }
  const baselineGrowth = findGrowth({ current: committed.counts, allowed: base.counts, renames });
  const prettierGrowth = newUnformatted({
    unformatted: committed.unformatted,
    listed: base.unformatted,
    renames,
  });
  if (baselineGrowth.length > 0 || prettierGrowth.length > 0) {
    process.stderr.write(`\nThe baseline grew compared to ${baseRef}:\n`);
    baselineGrowth.forEach(({ rule, file, count, allowed }) => {
      process.stderr.write(`  ${COUNTS} ${file}: ${rule} ${allowed} -> ${count}\n`);
    });
    prettierGrowth.forEach((file) => {
      process.stderr.write(`  ${PRETTIER_BASELINE} ${file}\n`);
    });
    failures.push('baseline grew');
  }
  if (await lintRulesChangedSince({ ref: baseRef })) {
    process.stderr.write(
      `\nThe lint rules (${CONFIG}, ${PLUGINS}/, ${SCRIPT} or the lint scripts) changed compared to ${baseRef}.\n`
    );
    failures.push('lint rules changed');
  }
  if (failures.includes('baseline grew') || failures.includes('lint rules changed')) {
    process.stderr.write(
      `If that is intended (turning a rule on or off), add the ${LABEL} label to the pull request.\n`
    );
  }
};

const check = async ({ committed, current, diagnostics, renames }) => {
  const failures = [];
  const growth = findGrowth({ current, allowed: committed.counts, renames });
  if (growth.length > 0) {
    process.stderr.write(
      'New lint violations. Fix them: the baseline only covers code that predates a rule.\n\n'
    );
    await printGrowth({ growth, diagnostics, ref: diffRef });
    failures.push('new violations');
  }
  if (!options.fast) {
    const unformatted = await listUnformatted();
    const prettierGrowth = newUnformatted({ unformatted, listed: committed.unformatted, renames });
    if (prettierGrowth.length > 0) {
      process.stderr.write('\nNot formatted. Run npx prettier --write on:\n');
      prettierGrowth.forEach((file) => {
        process.stderr.write(`  ${file}\n`);
      });
      failures.push('unformatted files');
    }
    await checkFixes({ current, committed, unformatted, failures });
  }
  if (baseRef && !options['allow-base-growth']) {
    await checkBase({ committed, renames, failures });
  }
  if (failures.length > 0) {
    process.exitCode = 1;
    return;
  }
  process.stdout.write('No new lint violations.\n');
};

const regenerate = async ({ committed, current, diagnostics, renames }) => {
  const growth = findGrowth({ current, allowed: committed.counts, renames });
  const unformatted = await listUnformatted();
  const prettierGrowth = newUnformatted({ unformatted, listed: committed.unformatted, renames });
  if ((growth.length > 0 || prettierGrowth.length > 0) && !options['allow-growth']) {
    process.stderr.write('Refusing to grow the baseline. Fix these instead:\n\n');
    await printGrowth({ growth, diagnostics, ref: 'HEAD' });
    prettierGrowth.forEach((file) => {
      process.stderr.write(`${file}: not formatted, run npx prettier --write ${file}\n`);
    });
    process.exitCode = 1;
    return;
  }
  await writeFile(BASELINE, `${JSON.stringify(baselineFor({ counts: current }), null, 2)}\n`);
  await writeFile(COUNTS, `${JSON.stringify(sortDeep({ value: current }), null, 2)}\n`);
  const ignored = await readFile(PRETTIER_IGNORE, 'utf8');
  await writeFile(PRETTIER_BASELINE, `${ignored}${PRETTIER_HEADER}\n${unformatted.join('\n')}\n`);
  process.stdout.write(
    `${COUNTS}: ${total({ counts: current })} violations in ${
      Object.keys(current).length
    } rules (was ${total({ counts: committed.counts })})\n${PRETTIER_BASELINE}: ${
      unformatted.length
    } files (was ${committed.unformatted.length})\n`
  );
};

const main = async () => {
  const lintArgs = options.fast && files.length > 0 ? files : LINT_PATHS;
  const diagnostics = await lintUnbaselined({ lintArgs });
  const uncounted = diagnostics.filter((diagnostic) => ruleName({ diagnostic }) === null);
  if (uncounted.length > 0) {
    process.stderr.write('These cannot be baselined (parse errors). Fix them:\n\n');
    uncounted.forEach((diagnostic) => {
      process.stderr.write(
        `  ${diagnostic.filename}:${lineOf({ diagnostic })} ${diagnostic.message}\n`
      );
    });
    process.exitCode = 1;
    return;
  }
  const [countsText, prettierText, renames] = await Promise.all([
    readOptional({ file: COUNTS }),
    readOptional({ file: PRETTIER_BASELINE }),
    renamesSince({ ref: options.check ? diffRef : 'HEAD' }),
  ]);
  const committed = {
    counts: countsText ? JSON.parse(countsText) : {},
    unformatted: prettierText ? parsePrettierBaseline({ text: prettierText }) : [],
  };
  const current = countViolations({ diagnostics });
  await (options.check
    ? check({ committed, current, diagnostics, renames })
    : regenerate({ committed, current, diagnostics, renames }));
};

main();
