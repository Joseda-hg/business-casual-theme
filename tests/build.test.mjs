import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
test('build publishes usable theme assets', async () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const css = await readFile(resolve(root, 'dist/business-casual.css'), 'utf8');
  assert.match(css, /\.bc\s*\{/);
  assert.match(css, /--bc-accent/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  const optionalCss = await readFile(resolve(root, 'dist/business-casual-manrope.css'), 'utf8');
  assert.match(optionalCss, /font-family/);
  assert.match(optionalCss, /url\("\.\/fonts\/manrope-latin-wght-normal\.woff2"\)/);
  const tableJs = await readFile(resolve(root, 'dist/business-casual-table.js'), 'utf8');
  assert.match(tableJs, /bc-table/);
  assert.ok((await stat(resolve(root, 'dist/fonts/manrope-latin-wght-normal.woff2'))).size > 1000);
  assert.match(await readFile(resolve(root, 'dist/fonts/MANROPE-LICENSE.txt'), 'utf8'), /SIL OPEN FONT LICENSE/i);
});
