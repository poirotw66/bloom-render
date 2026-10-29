/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { checkBundleBudget } from './check-bundle-budget.mjs';

function manifest() {
  return Object.fromEntries([
    ['index.html', { file: 'entry.js', imports: ['vendor'] }],
    ['vendor', { file: 'vendor.js', name: 'vendor', imports: ['index.html'] }],
    ...[
      'components/GenerateStartScreen.tsx',
      'components/SettingsModal.tsx',
      'components/HistoryPanel.tsx',
      'components/ViralTemplatesSection.tsx',
      'locales/en.ts',
      'locales/zh-TW.ts',
    ].map((key) => [key, { file: key, isDynamicEntry: true }]),
  ]) as Parameters<typeof checkBundleBudget>[0];
}

describe('production bundle budget', () => {
  it('checks both active-language boot graphs without double-counting shared cycles', () => {
    const result = checkBundleBudget(manifest(), () => new TextEncoder().encode('small chunk'));
    expect(result.homeGzipBytesByLanguage.en).toBeGreaterThan(result.entryGzipBytes);
    expect(result.homeGzipBytesByLanguage.en).toBe(result.homeGzipBytesByLanguage['zh-TW']);
  });

  it('rejects an eager locale or generator even when it fits under the byte limit', () => {
    const build = manifest();
    build['index.html'].imports?.push('locales/zh-TW.ts');
    expect(() => checkBundleBudget(build, () => new Uint8Array())).toThrow(
      'deferred build boundary',
    );
  });

  it('rejects async-only vendor code in the initial graph', () => {
    const build = manifest();
    build.vendor.name = 'image-archive';
    expect(() => checkBundleBudget(build, () => new Uint8Array())).toThrow('Async-only code');
  });

  it('fails when transitive initial JavaScript exceeds the gzip budget', () => {
    const bytes = new Uint8Array(200_000);
    let seed = 123;
    for (let index = 0; index < bytes.length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      bytes[index] = seed >>> 24;
    }
    expect(() => checkBundleBudget(manifest(), () => bytes)).toThrow('budget exceeded');
  });
});
