/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { PROMPT_GALLERY_ENTRIES } from './promptGallery';

describe('PROMPT_GALLERY_ENTRIES', () => {
  it('loads the seeded community presets', () => {
    expect(PROMPT_GALLERY_ENTRIES.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(PROMPT_GALLERY_ENTRIES.map((e) => e.id));
    expect(ids.size).toBe(PROMPT_GALLERY_ENTRIES.length);
    for (const entry of PROMPT_GALLERY_ENTRIES) {
      expect(entry.prompt.length).toBeGreaterThan(7);
      expect(entry.thumbnail.startsWith('examples/')).toBe(true);
      expect(['generate', 'retouch', 'adjust', 'filter']).toContain(entry.feature);
    }
  });
});
