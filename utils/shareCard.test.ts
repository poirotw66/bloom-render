/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { FOOTER_TEXT, SITE_URL } from './shareCard';

describe('shareCard constants', () => {
  it('exposes brand footer and site URL', () => {
    expect(FOOTER_TEXT).toContain('BloomRender');
    expect(SITE_URL).toMatch(/^https:\/\//);
  });
});
