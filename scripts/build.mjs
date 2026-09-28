import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'fonts'), { recursive: true });
for (const [source, target] of [
  ['styles/business-casual.css', 'business-casual.css'],
  ['styles/business-casual-manrope.css', 'business-casual-manrope.css'],
  ['scripts/business-casual-table.js', 'business-casual-table.js'],
  ['assets/manrope-latin-wght-normal.woff2', 'fonts/manrope-latin-wght-normal.woff2'],
  ['assets/MANROPE-LICENSE.txt', 'fonts/MANROPE-LICENSE.txt'],
]) {
  await cp(resolve(root, source), resolve(dist, target));
}

// The optional font stylesheet moves from styles/ to dist/, while the font
// moves from assets/ to dist/fonts/. Keep the published URL relative to CSS.
const fontCssPath = resolve(dist, 'business-casual-manrope.css');
const fontCss = await readFile(fontCssPath, 'utf8');
const sourceUrl = '../assets/manrope-latin-wght-normal.woff2';
if (!fontCss.includes(sourceUrl)) throw new Error(`Expected font URL missing from ${fontCssPath}`);
await writeFile(fontCssPath, fontCss.replace(sourceUrl, './fonts/manrope-latin-wght-normal.woff2'));
