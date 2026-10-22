/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';
import { getViralTemplateById, VIRAL_TEMPLATE_IDS, VIRAL_TEMPLATES } from './viralTemplates';

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

  it('has unique ids, prompts, and thumbnails', () => {
    const ids = VIRAL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of VIRAL_TEMPLATES) {
      expect(template.prompt.length).toBeGreaterThan(40);
      expect(template.thumbnail).toMatch(/^examples\/.+\.webp$/);
      expect(template.feature).toMatch(/^(generate|retouch)$/);
      expect(getViralTemplateById(template.id)).toBe(template);
    }
  });

  it('exposes zh-TW and EN title/description keys for every template', () => {
    for (const template of VIRAL_TEMPLATES) {
      expect(enMessages[template.titleKey]).toBeTruthy();
      expect(enMessages[template.descriptionKey]).toBeTruthy();
      expect(zhTWMessages[template.titleKey]).toBeTruthy();
      expect(zhTWMessages[template.descriptionKey]).toBeTruthy();
    }
    expect(enMessages['viral.section_title']).toBeTruthy();
    expect(zhTWMessages['viral.section_title']).toBeTruthy();
    expect(enMessages['viral.use_this_style']).toMatch(/Use this style/i);
    expect(zhTWMessages['viral.use_this_style']).toMatch(/用同款/);
  });
});
