/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Documents Wave N primary-button contrast (white text on brand fill) before/after.
 */

import { describe, expect, it } from 'vitest';

function relativeLuminance(hex: string): number {
  const n = hex.replace('#', '');
  const rgb = [0, 2, 4]
    .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

/** Wave K / audit-measured primary fills (failed AA with white text). */
const BEFORE = {
  bloom: '#d946ef',
  night: '#3b82f6',
  newyear: '#dc2626',
} as const;

/** Wave N darkened brand-primary (index.css). */
const AFTER = {
  bloom: '#c026d3',
  night: '#2563eb',
  newyear: '#b91c1c',
} as const;

describe('brand primary contrast (white on fill)', () => {
  it('records before/after ratios and meets WCAG AA 4.5:1 after', () => {
    const white = '#ffffff';
    const report = (Object.keys(BEFORE) as Array<keyof typeof BEFORE>).map((theme) => ({
      theme,
      before: Number(contrastRatio(white, BEFORE[theme]).toFixed(2)),
      after: Number(contrastRatio(white, AFTER[theme]).toFixed(2)),
    }));

    // Snapshot the documented numbers for the PR summary.
    expect(report).toEqual([
      { theme: 'bloom', before: 3.46, after: 4.71 },
      { theme: 'night', before: 3.68, after: 5.17 },
      { theme: 'newyear', before: 4.83, after: 6.47 },
    ]);

    for (const row of report) {
      expect(row.after).toBeGreaterThanOrEqual(4.5);
    }
  });
});
