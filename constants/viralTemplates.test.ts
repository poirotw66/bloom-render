/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';
import {
  GENERIC_EXAMPLE_THUMBNAILS,
  getViralTemplateById,
  VIRAL_TEMPLATE_IDS,
  VIRAL_TEMPLATES,
  type ViralTemplateCategory,
} from './viralTemplates';

const EXPECTED_IDS = [
  'acrylic-standee',
  'anime-handpainted',
  'brick-minifig',
  'chibi-3d',
  'claymation',
  'era-70s-taiwan',
  'era-80s-taiwan',
  'era-90s-taiwan',
  'figurine-box',
  'hk-90s-film',
  'line-stickers',
  'magazine-cover',
  'pixel-art',
  'polaroid-frame',
  'pro-headshot',
  'purikura',
  'taiwan-101',
  'taiwan-jiufen',
  'taiwan-night-market',
  'ukiyo-e',
].sort();

const WAVE_U_IDS = [
  'chibi-3d',
  'line-stickers',
  'acrylic-standee',
  'pixel-art',
  'claymation',
  'ukiyo-e',
  'hk-90s-film',
  'magazine-cover',
  'purikura',
  'brick-minifig',
  'pro-headshot',
  'anime-handpainted',
];

const FILTER_CATEGORIES: Array<ViralTemplateCategory | 'all'> = [
  'all',
  'figurine',
  'polaroid',
  'era',
  'taiwan',
  'toy',
  'art',
  'retro',
  'social',
];

describe('viralTemplates', () => {
  it('ships the expected viral pack ids (20)', () => {
    expect(VIRAL_TEMPLATES).toHaveLength(20);
    expect([...VIRAL_TEMPLATE_IDS].sort()).toEqual(EXPECTED_IDS);
  });

  it('includes the Wave U twelve new template ids', () => {
    for (const id of WAVE_U_IDS) {
      expect(VIRAL_TEMPLATE_IDS.has(id), id).toBe(true);
    }
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

  it('keeps viral thumbnail file bytes unique (no duplicate images)', () => {
    const hashes = new Map<string, string>();
    for (const template of VIRAL_TEMPLATES) {
      const onDisk = join(process.cwd(), 'public', template.thumbnail);
      const digest = createHash('sha256').update(readFileSync(onDisk)).digest('hex');
      expect(hashes.has(digest), `${template.thumbnail} duplicates ${hashes.get(digest)}`).toBe(
        false,
      );
      hashes.set(digest, template.thumbnail);
    }
  });

  it('does not reuse generic gallery/example preview images', () => {
    for (const template of VIRAL_TEMPLATES) {
      expect(GENERIC_EXAMPLE_THUMBNAILS.has(template.thumbnail)).toBe(false);
      expect(template.thumbnail).not.toMatch(/portrait-|editor-|generate-|travel-|idphoto-|tryon-/);
    }
  });

  it('avoids trademarked brand names in brick / anime prompts and titles', () => {
    const brick = getViralTemplateById('brick-minifig');
    const anime = getViralTemplateById('anime-handpainted');
    expect(brick).toBeTruthy();
    expect(anime).toBeTruthy();
    const brandRe = /\b(lego|lego(?:s)?|disney|ghibli|pixar)\b/i;
    expect(brick!.prompt).not.toMatch(brandRe);
    expect(anime!.prompt).not.toMatch(brandRe);
    expect(enMessages[brick!.titleKey]).not.toMatch(brandRe);
    expect(zhTWMessages[brick!.titleKey]).not.toMatch(/樂高/);
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
    for (const cat of FILTER_CATEGORIES) {
      expect(enMessages[`viral.filter_${cat}`]).toBeTruthy();
      expect(zhTWMessages[`viral.filter_${cat}`]).toBeTruthy();
    }
  });
});
