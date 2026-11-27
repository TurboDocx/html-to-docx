import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { rollup } from 'rollup';

import configs from '../rollup.config';

describe('node library bundle', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(path.join(process.cwd(), 'tests/.node-bundle-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('does not evaluate the browser debug implementation', async () => {
    const entry = path.join(dir, 'entry.js');
    const bundleFile = path.join(dir, 'bundle.cjs');
    writeFileSync(entry, "module.exports = require('debug')('html-to-docx-test');\n");

    const libraryConfig = configs[0];
    const plugins = libraryConfig.plugins.filter(
      (plugin) => !['cleaner', 'terser'].includes(plugin.name)
    );
    const bundle = await rollup({ input: entry, plugins });
    const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
    writeFileSync(bundleFile, output[0].code);
    await bundle.close();

    const result = spawnSync(process.execPath, [bundleFile], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain(
      'ExperimentalWarning: localStorage is not available because --localstorage-file was not provided'
    );
  }, 30000);
});
