/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  FIRST_PAINT_JS_GZIP_BUDGET_BYTES,
  INDEX_ENTRY_GZIP_BUDGET_BYTES,
} from './check-bundle-size.mjs';

describe('bundle size budgets', () => {
  it('keeps index entry budget at least 25% under the 126.22 KB baseline', () => {
    const baseline = 126.22 * 1024;
    const target = baseline * 0.75;
    expect(INDEX_ENTRY_GZIP_BUDGET_BYTES).toBeLessThanOrEqual(target);
    expect(INDEX_ENTRY_GZIP_BUDGET_BYTES).toBe(94 * 1024);
  });

  it('sets a first-paint JS ceiling', () => {
    expect(FIRST_PAINT_JS_GZIP_BUDGET_BYTES).toBe(280 * 1024);
    expect(FIRST_PAINT_JS_GZIP_BUDGET_BYTES).toBeGreaterThan(INDEX_ENTRY_GZIP_BUDGET_BYTES);
  });
});
