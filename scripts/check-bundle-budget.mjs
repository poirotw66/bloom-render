/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

// Includes the active locale and the immediately rendered viral picker, not only entry.js.
export const INITIAL_JS_GZIP_BUDGET = 175 * 1024;

/** @param {Record<string, {file: string, name?: string, imports?: string[], isDynamicEntry?: boolean}>} manifest
 * @param {(file: string) => Uint8Array} readAsset
 */
export function checkBundleBudget(manifest, readAsset) {
  function graph(entry, seen = new Set()) {
    if (seen.has(entry)) return seen;
    const chunk = manifest[entry];
    if (!chunk) throw new Error(`Missing build manifest entry: ${entry}`);
    seen.add(entry);
    for (const imported of chunk.imports ?? []) graph(imported, seen);
    return seen;
  }
  const entry = graph('index.html');
  const deferred = [
    'components/GenerateStartScreen.tsx',
    'components/SettingsModal.tsx',
    'components/HistoryPanel.tsx',
    'locales/en.ts',
    'locales/zh-TW.ts',
  ];
  for (const key of deferred) {
    if (!manifest[key]?.isDynamicEntry || entry.has(key)) {
      throw new Error(`Expected a deferred build boundary: ${key}`);
    }
  }
  const eagerNames = [...entry].map((key) => manifest[key].name ?? key);
  const forbidden = eagerNames.filter((name) =>
    /^(gemini-sdk|transformers|image-archive|share-qr|image-crop)$/.test(name),
  );
  if (forbidden.length)
    throw new Error(`Async-only code entered the initial graph: ${forbidden.join(', ')}`);

  const home = graph('components/ViralTemplatesSection.tsx', new Set(entry));
  const gzipBytes = (keys) =>
    [...keys].reduce((total, key) => total + gzipSync(readAsset(manifest[key].file)).length, 0);
  const locales = Object.fromEntries(
    ['en', 'zh-TW'].map((language) => [
      language,
      gzipBytes(graph(`locales/${language}.ts`, new Set(home))),
    ]),
  );
  const largest = Math.max(...Object.values(locales));
  if (largest > INITIAL_JS_GZIP_BUDGET) {
    throw new Error(
      `Initial JavaScript gzip budget exceeded: ${largest} > ${INITIAL_JS_GZIP_BUDGET} bytes`,
    );
  }
  return {
    entryGzipBytes: gzipBytes(entry),
    homeGzipBytesByLanguage: locales,
    budgetBytes: INITIAL_JS_GZIP_BUDGET,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const directory = resolve(process.argv[2] ?? 'dist');
    const manifest = JSON.parse(readFileSync(resolve(directory, '.vite/manifest.json'), 'utf8'));
    console.log(
      `Bundle budget passed: ${JSON.stringify(checkBundleBudget(manifest, (file) => readFileSync(resolve(directory, file))))}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
