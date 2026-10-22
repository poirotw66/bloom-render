/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  PROMPT_GALLERY_ENTRIES,
  localizedGalleryTitle,
  localizedGalleryDescription,
} from './promptGallery';

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
        expect(entry.thumbnail).toMatch(
          /^examples\/(?:(?:viral|gallery)\/)?[A-Za-z0-9._-]+\.webp$/,
        );
      }
    }
  });

  it('requires a Traditional Chinese title on every entry', () => {
    for (const entry of PROMPT_GALLERY_ENTRIES) {
      expect(entry.titleZh.trim().length, entry.id).toBeGreaterThan(1);
      expect(entry.titleZh).not.toEqual(entry.title);
    }
  });

  it('localizes title and description by language', () => {
    const entry = PROMPT_GALLERY_ENTRIES.find((e) => e.id === 'era-70s-taiwan');
    expect(entry).toBeTruthy();
    expect(localizedGalleryTitle(entry!, 'en')).toBe(entry!.title);
    expect(localizedGalleryTitle(entry!, 'zh-TW')).toBe(entry!.titleZh);
    expect(localizedGalleryDescription(entry!, 'zh-TW')).toBe(entry!.descriptionZh);
  });
});
