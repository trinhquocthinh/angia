import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { measureInitialBundles, type ViteManifest } from './initialBundle.js';

/** NFR-1/TC-094: gói JS ban đầu của mọi trang đầu ≤ 200 KB sau gzip. */
const BUDGET_BYTES = 200 * 1024;
// Build riêng kèm manifest vào thư mục cache để bản phát hành không lộ manifest.
const OUT_DIR = join(process.cwd(), 'node_modules/.cache/perf-budget');

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

execFileSync(
  'yarn',
  ['workspace', '@angia/web', 'exec', 'vite', 'build', '--manifest', '--emptyOutDir', '--outDir', OUT_DIR],
  {
    stdio: 'ignore',
  },
);

const manifest = JSON.parse(readFileSync(join(OUT_DIR, '.vite/manifest.json'), 'utf8')) as ViteManifest;
const report = measureInitialBundles(manifest, (file) => gzipSync(readFileSync(join(OUT_DIR, file))).length);

console.log(`Entry (framework): ${kb(report.entry.bytes)}`);
for (const route of report.routes) console.log(`${kb(route.bytes).padStart(9)}  ${route.route}`);

const over = report.routes.filter((route) => route.bytes > BUDGET_BYTES);
if (over.length > 0) {
  console.error(`Vượt ngân sách ${kb(BUDGET_BYTES)}: ${over.map((route) => route.route).join(', ')}`);
  process.exit(1);
}
console.log(`Đạt ngân sách ${kb(BUDGET_BYTES)} gzip cho mọi trang đầu.`);
