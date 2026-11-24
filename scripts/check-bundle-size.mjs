/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Guard homepage entry gzip size so viral prompts / dual locales cannot
 * sneak back into the main chunk. Run after `vite build`.
 *
 * Baseline (main @ 99161ce / prior wave): ~126.22 KB gzip for index-*.js.
 * Wave AA target: ≤ 94.66 KB (−25%). Budget below leaves a little headroom.
 */

import { createGzip } from 'node:zlib';
import { createReadStream, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';

/** Max gzip bytes for dist/assets/index-*.js (homepage entry). */
// Baseline ~126.22 KB gzip; −25% ⇒ ≤94.665 KB. Budget = 94 KB.
export const INDEX_ENTRY_GZIP_BUDGET_BYTES = 94 * 1024;

/** Soft ceiling for first-paint JS: entry + vendor + initial locale (if any). */
export const FIRST_PAINT_JS_GZIP_BUDGET_BYTES = 280 * 1024; // 280 KB

const ASSETS = join(process.cwd(), 'dist', 'assets');

async function gzipSize(filePath) {
  let total = 0;
  const counter = new Writable({
    write(chunk, _enc, cb) {
      total += chunk.length;
      cb();
    },
  });
  await pipeline(createReadStream(filePath), createGzip({ level: 9 }), counter);
  return total;
}

function listJsAssets() {
  return readdirSync(ASSETS)
    .filter((name) => name.endsWith('.js'))
    .map((name) => {
      const filePath = join(ASSETS, name);
      return { name, filePath, raw: statSync(filePath).size };
    });
}

function pickIndexEntry(files) {
  const matches = files.filter((f) => /^index-.*\.js$/.test(f.name));
  if (matches.length === 0) {
    throw new Error('No dist/assets/index-*.js found — run vite build first.');
  }
  // Prefer the largest if multiple (should be one).
  return matches.sort((a, b) => b.raw - a.raw)[0];
}

function isFirstPaintCandidate(name) {
  return (
    /^index-.*\.js$/.test(name) ||
    /^vendor-.*\.js$/.test(name) ||
    /^(en|zh-TW)-.*\.js$/.test(name) ||
    /^locales?-.*\.js$/.test(name)
  );
}

export async function measureBundle() {
  const files = listJsAssets();
  const withGzip = [];
  for (const f of files) {
    withGzip.push({ ...f, gzip: await gzipSize(f.filePath) });
  }
  const index = pickIndexEntry(withGzip);
  const firstPaint = withGzip.filter((f) => isFirstPaintCandidate(f.name));
  const firstPaintGzip = firstPaint.reduce((sum, f) => sum + f.gzip, 0);
  return { index, firstPaint, firstPaintGzip, all: withGzip };
}

async function main() {
  const report = await measureBundle();
  const { index, firstPaintGzip, firstPaint } = report;

  const kb = (n) => (n / 1024).toFixed(2);
  const lines = [
    `index entry: ${index.name}`,
    `  raw:  ${kb(index.raw)} KB`,
    `  gzip: ${kb(index.gzip)} KB (budget ${kb(INDEX_ENTRY_GZIP_BUDGET_BYTES)} KB)`,
    `first-paint JS (index + vendor + locale chunks):`,
    ...firstPaint.sort((a, b) => b.gzip - a.gzip).map((f) => `  ${f.name}: gzip ${kb(f.gzip)} KB`),
    `  total gzip: ${kb(firstPaintGzip)} KB (budget ${kb(FIRST_PAINT_JS_GZIP_BUDGET_BYTES)} KB)`,
  ];
  const text = lines.join('\n');
  console.log(text);

  const outPath = join(process.cwd(), 'dist', 'bundle-size-report.txt');
  writeFileSync(outPath, `${text}\n`, 'utf8');

  let failed = false;
  if (index.gzip > INDEX_ENTRY_GZIP_BUDGET_BYTES) {
    console.error(
      `\nFAIL: index gzip ${kb(index.gzip)} KB exceeds budget ${kb(INDEX_ENTRY_GZIP_BUDGET_BYTES)} KB`,
    );
    failed = true;
  }
  if (firstPaintGzip > FIRST_PAINT_JS_GZIP_BUDGET_BYTES) {
    console.error(
      `\nFAIL: first-paint JS gzip ${kb(firstPaintGzip)} KB exceeds budget ${kb(FIRST_PAINT_JS_GZIP_BUDGET_BYTES)} KB`,
    );
    failed = true;
  }
  if (failed) process.exit(1);
  console.log('\nBundle size check passed.');
}

const isDirect = process.argv[1] && process.argv[1].endsWith('check-bundle-size.mjs');
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
