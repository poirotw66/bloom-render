/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { PROMPT_GALLERY_ENTRIES } from './promptGallery';

describe('PROMPT_GALLERY_ENTRIES', () => {
  it('loads ~30 community presets with unique ids', () => {
    expect(PROMPT_GALLERY_ENTRIES.length).toBeGreaterThanOrEqual(28);
    expect(PROMPT_GALLERY_ENTRIES.length).toBeLessThanOrEqual(36);
    const ids = new Set(PROMPT_GALLERY_ENTRIES.map((e) => e.id));
    expect(ids.size).toBe(PROMPT_GALLERY_ENTRIES.length);
    for (const entry of PROMPT_GALLERY_ENTRIES) {
      expect(entry.prompt.length).toBeGreaterThan(7);
      expect(['generate', 'retouch', 'adjust', 'filter']).toContain(entry.feature);
      if (entry.thumbnail !== undefined) {
        expect(entry.thumbnail).toMatch(/^examples\/(?:viral\/)?[A-Za-z0-9._-]+\.webp$/);
      }
    }
  });

  it('allows gradient-only entries without thumbnails', () => {
    const missing = PROMPT_GALLERY_ENTRIES.filter((e) => !e.thumbnail);
    expect(missing.length).toBeGreaterThan(0);
  });
});
