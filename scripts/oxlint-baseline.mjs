// Ratchet for lint and formatting problems that predate a rule. Generated files, all committed:
//
//   .oxlint-baseline.json         For each rule, the files that already break it. .oxlintrc.json extends
//                                 it, so editors and `npm run lint` stay quiet about old code.
//   .oxlint-baseline-counts.json  For each rule and file, how many violations exist. `--check` fails when
//                                 any count goes up, so a listed file cannot gain new violations either.
//   .prettier-baseline            The files Prettier would still reformat. `npm run prettier:check` uses it
//                                 as its ignore file, so it starts with everything .prettierignore skips.
//
//   node scripts/oxlint-baseline.mjs                  after fixing problems: shrink all three files
//   node scripts/oxlint-baseline.mjs --check          fail on any violation the counts do not cover
//   node scripts/oxlint-baseline.mjs --check --base <ref>
//                                                     CI on a pull request: also fail if the committed
//                                                     lists grew compared to <ref>, unless
//                                                     --allow-base-growth is passed (CI passes it when
//                                                     the PR carries the lint-baseline-growth label)
//   node scripts/oxlint-baseline.mjs --allow-growth   regenerate even though they grow; only for turning
//                                                     on a new rule
import { execFile } from 'node:child_process';
import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const CONFIG = '.oxlintrc.json';
const BASELINE = '.oxlint-baseline.json';
const COUNTS = '.oxlint-baseline-counts.json';
const PRETTIER_IGNORE = '.prettierignore';
const PRETTIER_BASELINE = '.prettier-baseline';
const PRETTIER_HEADER = '# Not yet formatted, see scripts/oxlint-baseline.mjs';
const PRETTIER_GLOB = '**/*.js';
const UNBASELINED_CONFIG = '.oxlintrc.unbaselined.json'; // gitignored, removed after every run
const EXTENDS_LINE = /^\s*"extends": \["\.\/\.oxlint-baseline\.json"\],\n/mu;
const MAX_BUFFER = 1024 ** 3;

const args = process.argv.slice(2);
const baseRef = args.includes('--base') ? args[args.indexOf('--base') + 1] : null;
const execFileAsync = promisify(execFile);

// Runs a command and returns its output. Linters and git exit 1 to report findings, which is
// output wanted here; anything else is an error.
const run = async ({ command, commandArgs, allowedStatus = [0, 1] }) => {
  try {
    const { stdout } = await execFileAsync(command, commandArgs, { maxBuffer: MAX_BUFFER });
    return { stdout, status: 0 };
  } catch (error) {
    if (allowedStatus.includes(error.code)) {
      return { stdout: error.stdout, status: error.code };
    }
    throw error;
  }
};

// "eslint(no-console)" -> "no-console"; "import-js(order)" -> "import-js/order"
const ruleName = ({ diagnostic }) => {
  const match = /^(?<scope>.+?)\((?<rule>.+)\)$/u.exec(diagnostic.code ?? '');
  if (!match) {
    throw new Error(
      `${diagnostic.filename}: ${diagnostic.message} (cannot be baselined, fix it first)`
    );
  }
  const { scope, rule } = match.groups;
  return scope === 'eslint' ? rule : `${scope.replace('_', '-')}/${rule}`;
};

// Lint as if nothing were baselined, without touching the committed files: a failed or
// interrupted run leaves them as they were.
const lintUnbaselined = async () => {
  const config = await readFile(CONFIG, 'utf8');
  if (!EXTENDS_LINE.test(config)) {
    throw new Error(`${CONFIG} must extend ./${BASELINE} on its own line`);
  }
  await writeFile(UNBASELINED_CONFIG, config.replace(EXTENDS_LINE, ''));
  try {
    const { stdout } = await run({
      command: 'npx',
      commandArgs: ['oxlint', '-c', UNBASELINED_CONFIG, '-f', 'json', '.'],
    });
    return JSON.parse(stdout).diagnostics;
  } finally {
    await rm(UNBASELINED_CONFIG, { force: true });
  }
};

const countViolations = ({ diagnostics }) => {
  const counts = {};
  diagnostics.forEach((diagnostic) => {
    const rule = ruleName({ diagnostic });
    counts[rule] ??= {};
    counts[rule][diagnostic.filename] = (counts[rule][diagnostic.filename] ?? 0) + 1;
  });
  return counts;
};

// Every rule and file whose count in `current` is above the one in `allowed`.
const findGrowth = ({ current, allowed }) =>
  Object.entries(current).flatMap(([rule, files]) =>
    Object.entries(files)
      .filter(([file, count]) => count > (allowed[rule]?.[file] ?? 0))
      .map(([file, count]) => ({ rule, file, count, allowed: allowed[rule]?.[file] ?? 0 }))
  );

const printGrowth = ({ growth, diagnostics }) => {
  growth.forEach(({ rule, file, count, allowed }) => {
    process.stderr.write(`${file}: ${rule}, ${count} violation(s) where ${allowed} existed\n`);
    diagnostics
      .filter((diagnostic) => diagnostic.filename === file && ruleName({ diagnostic }) === rule)
      .forEach((diagnostic) => {
        const line = diagnostic.labels?.[0]?.span?.line ?? '?';
        process.stderr.write(`  ${file}:${line} ${diagnostic.message}\n`);
      });
  });
};

const total = ({ counts }) => {
  let sum = 0;
  Object.values(counts).forEach((files) => {
    Object.values(files).forEach((count) => {
      sum += count;
    });
  });
  return sum;
};

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

// Baseline paths are globs in the config, so escape brackets in a file name.
const escapeGlob = ({ file }) => file.replaceAll(/[[\]]/gu, String.raw`\$&`);

// The files Prettier would reformat, ignoring only what .prettierignore ignores.
const listUnformatted = async () => {
  const { stdout } = await run({
    command: 'npx',
    commandArgs: ['prettier', '--list-different', '--ignore-path', PRETTIER_IGNORE, PRETTIER_GLOB],
  });
  return stdout.split('\n').filter(Boolean).toSorted();
};

// The files listed in a .prettier-baseline text, after its header line.
const parsePrettierBaseline = ({ text }) => {
  const lines = text.split('\n');
  const start = lines.indexOf(PRETTIER_HEADER);
  return start === -1 ? [] : lines.slice(start + 1).filter(Boolean);
};

const fileExists = async ({ file }) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

const readCommitted = async () => {
  const counts = (await fileExists({ file: COUNTS }))
    ? JSON.parse(await readFile(COUNTS, 'utf8'))
    : {};
  const unformatted = (await fileExists({ file: PRETTIER_BASELINE }))
    ? parsePrettierBaseline({ text: await readFile(PRETTIER_BASELINE, 'utf8') })
    : [];
  return { counts, unformatted };
};

// What the committed lists held at `ref`, or null when the baseline did not exist there yet.
const committedAt = async ({ ref }) => {
  const counts = await run({
    command: 'git',
    commandArgs: ['show', `${ref}:${COUNTS}`],
    allowedStatus: [0, 128],
  });
  if (counts.status !== 0) {
    return null;
  }
  const prettier = await run({
    command: 'git',
    commandArgs: ['show', `${ref}:${PRETTIER_BASELINE}`],
    allowedStatus: [0, 128],
  });
  return {
    counts: JSON.parse(counts.stdout),
    unformatted: prettier.status === 0 ? parsePrettierBaseline({ text: prettier.stdout }) : [],
  };
};

const check = async ({ committed, current, diagnostics }) => {
  const growth = findGrowth({ current, allowed: committed.counts });
  let failed = growth.length > 0;
  if (failed) {
    process.stderr.write(
      'New lint violations. Fix them; the baseline only covers code that predates a rule.\n\n'
    );
    printGrowth({ growth, diagnostics });
  }
  const base = baseRef ? await committedAt({ ref: baseRef }) : null;
  if (base && !args.includes('--allow-base-growth')) {
    const baselineGrowth = findGrowth({ current: committed.counts, allowed: base.counts });
    const prettierGrowth = committed.unformatted.filter((file) => !base.unformatted.includes(file));
    if (baselineGrowth.length > 0 || prettierGrowth.length > 0) {
      failed = true;
      process.stderr.write(
        `\nThe baseline grew compared to ${baseRef}. If that is intended (a newly enabled rule), add the lint-baseline-growth label:\n`
      );
      baselineGrowth.forEach(({ rule, file, count, allowed }) => {
        process.stderr.write(`  ${COUNTS} ${file}: ${rule} ${allowed} -> ${count}\n`);
      });
      prettierGrowth.forEach((file) => {
        process.stderr.write(`  ${PRETTIER_BASELINE} ${file}\n`);
      });
    }
  }
  if (failed) {
    process.exitCode = 1;
    return;
  }
  const fixed = total({ counts: committed.counts }) - total({ counts: current });
  const hint = fixed > 0 ? ` ${fixed} fixed: run npm run lint:baseline to lock them in.` : '';
  process.stdout.write(`No new lint violations.${hint}\n`);
};

const regenerate = async ({ committed, current, diagnostics }) => {
  const growth = findGrowth({ current, allowed: committed.counts });
  const unformatted = await listUnformatted();
  const prettierGrowth = unformatted.filter((file) => !committed.unformatted.includes(file));
  if ((growth.length > 0 || prettierGrowth.length > 0) && !args.includes('--allow-growth')) {
    process.stderr.write('Refusing to grow the baseline. Fix these instead:\n\n');
    printGrowth({ growth, diagnostics });
    prettierGrowth.forEach((file) => {
      process.stderr.write(`${file}: not formatted, run npx prettier --write ${file}\n`);
    });
    process.exitCode = 1;
    return;
  }
  const overrides = Object.keys(current)
    .toSorted()
    .map((rule) => ({
      files: Object.keys(current[rule])
        .toSorted()
        .map((file) => escapeGlob({ file })),
      rules: { [rule]: 'off' },
    }));
  await writeFile(BASELINE, `${JSON.stringify({ overrides }, null, 2)}\n`);
  await writeFile(COUNTS, `${JSON.stringify(sortDeep({ value: current }), null, 2)}\n`);
  const ignored = await readFile(PRETTIER_IGNORE, 'utf8');
  await writeFile(PRETTIER_BASELINE, `${ignored}${PRETTIER_HEADER}\n${unformatted.join('\n')}\n`);
  process.stdout.write(
    `${COUNTS}: ${total({ counts: current })} violations in ${overrides.length} rules (was ${total({
      counts: committed.counts,
    })})\n${PRETTIER_BASELINE}: ${unformatted.length} files (was ${committed.unformatted.length})\n`
  );
};

const main = async () => {
  const committed = await readCommitted();
  const diagnostics = await lintUnbaselined();
  const current = countViolations({ diagnostics });
  await (args.includes('--check')
    ? check({ committed, current, diagnostics })
    : regenerate({ committed, current, diagnostics }));
};

main();
