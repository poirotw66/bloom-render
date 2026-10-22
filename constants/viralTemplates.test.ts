/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';
import {
  GENERIC_EXAMPLE_THUMBNAILS,
  getViralTemplateById,
  VIRAL_TEMPLATE_IDS,
  VIRAL_TEMPLATES,
} from './viralTemplates';

describe('viralTemplates', () => {
  it('ships the expected viral pack ids', () => {
    expect([...VIRAL_TEMPLATE_IDS].sort()).toEqual(
      [
        'era-70s-taiwan',
        'era-80s-taiwan',
        'era-90s-taiwan',
        'figurine-box',
        'polaroid-frame',
        'taiwan-101',
        'taiwan-jiufen',
        'taiwan-night-market',
      ].sort(),
    );
  });

  it('has unique ids, prompts, and dedicated viral thumbnails', () => {
    const ids = VIRAL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);

    const thumbs = VIRAL_TEMPLATES.map((t) => t.thumbnail);
    expect(new Set(thumbs).size).toBe(thumbs.length);

    for (const template of VIRAL_TEMPLATES) {
      expect(template.prompt.length).toBeGreaterThan(40);
      expect(template.thumbnail).toMatch(/^examples\/viral\/[a-z0-9-]+\.webp$/);
      expect(GENERIC_EXAMPLE_THUMBNAILS.has(template.thumbnail)).toBe(false);
      expect(template.feature).toMatch(/^(generate|retouch)$/);
      expect(getViralTemplateById(template.id)).toBe(template);

      const onDisk = join(process.cwd(), 'public', template.thumbnail);
      expect(existsSync(onDisk), onDisk).toBe(true);
    }
  });

  it('does not reuse generic gallery/example preview images', () => {
    for (const template of VIRAL_TEMPLATES) {
      expect(GENERIC_EXAMPLE_THUMBNAILS.has(template.thumbnail)).toBe(false);
      // Filename should include a style cue (id stem or category word), not shared names.
      expect(template.thumbnail).not.toMatch(/portrait-|editor-|generate-|travel-|idphoto-|tryon-/);
    }
  });

  it('exposes zh-TW and EN title/description/alt keys for every template', () => {
    for (const template of VIRAL_TEMPLATES) {
      expect(enMessages[template.titleKey]).toBeTruthy();
      expect(enMessages[template.descriptionKey]).toBeTruthy();
      expect(enMessages[template.thumbnailAltKey]).toBeTruthy();
      expect(zhTWMessages[template.titleKey]).toBeTruthy();
      expect(zhTWMessages[template.descriptionKey]).toBeTruthy();
      expect(zhTWMessages[template.thumbnailAltKey]).toBeTruthy();
    }
    expect(enMessages['viral.section_title']).toBeTruthy();
    expect(zhTWMessages['viral.section_title']).toBeTruthy();
    expect(enMessages['viral.use_this_style']).toMatch(/Use this style/i);
    expect(zhTWMessages['viral.use_this_style']).toMatch(/用同款/);
  });
});
