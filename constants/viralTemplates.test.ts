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
  'anime-sky-poster',
  'astronaut',
  'autumn-cafe',
  'book-nook',
  'brick-minifig',
  'chalk-caricature',
  'chibi-3d',
  'city-pop-cover',
  'classical-oil-painting',
  'claymation',
  'cny-portrait',
  'comic-pop-art',
  'crochet-amigurumi',
  'cyberpunk-neon',
  'double-exposure',
  'embroidery',
  'era-70s-taiwan',
  'era-80s-taiwan',
  'era-90s-taiwan',
  'fantasy-rpg-hero',
  'felt-plush',
  'figurine-box',
  'film-noir',
  'flat-vector-avatar',
  'hk-90s-film',
  'iso-diorama',
  'korean-studio-portrait',
  'line-stickers',
  'magazine-cover',
  'mermaid-underwater',
  'paper-cut',
  'pencil-sketch',
  'pet-human',
  'pixel-art',
  'polaroid-frame',
  'pro-headshot',
  'purikura',
  'snow-globe',
  'stained-glass',
  'taiwan-101',
  'taiwan-jiufen',
  'taiwan-night-market',
  'tarot-card',
  'temple-festival',
  'trading-card',
  'ukiyo-e',
  'vaporwave',
  'vintage-travel-poster',
  'watercolor-illustration',
  'wedding-photo',
  'wuxia-costume',
  'y2k-digicam',
  'yearbook-90s',
  'yukata-festival',
].sort();

const WAVE_X_IDS = [
  'book-nook',
  'anime-sky-poster',
  'fantasy-rpg-hero',
  'korean-studio-portrait',
  'chalk-caricature',
  'mermaid-underwater',
  'autumn-cafe',
  'temple-festival',
  'flat-vector-avatar',
  'double-exposure',
  'city-pop-cover',
  'crochet-amigurumi',
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
  'costume',
];

describe('viralTemplates', () => {
  it('ships the expected viral pack ids (56)', () => {
    expect(VIRAL_TEMPLATES).toHaveLength(56);
    expect([...VIRAL_TEMPLATE_IDS].sort()).toEqual(EXPECTED_IDS);
  });

  it('includes the Wave X twelve new template ids', () => {
    for (const id of WAVE_X_IDS) {
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
      expect(template.thumbnail).not.toMatch(
        /^examples\/(portrait|editor|generate|travel|idphoto|tryon)-/,
      );
    }
  });

  it('Wave X prompts ask to preserve facial identity', () => {
    for (const id of WAVE_X_IDS) {
      const t = getViralTemplateById(id);
      expect(t, id).toBeTruthy();
      expect(t!.prompt.toLowerCase()).toMatch(/identity|likeness|facial|face|recogniz/);
    }
  });

  it('avoids trademarked brand/game names in sensitive templates', () => {
    const brick = getViralTemplateById('brick-minifig');
    const trading = getViralTemplateById('trading-card');
    const astronaut = getViralTemplateById('astronaut');
    const fantasy = getViralTemplateById('fantasy-rpg-hero');
    const cityPop = getViralTemplateById('city-pop-cover');
    const crochet = getViralTemplateById('crochet-amigurumi');
    expect(brick && trading && astronaut && fantasy && cityPop && crochet).toBeTruthy();
    const brandRe =
      /\b(lego|pokemon|yu-?gi-?oh|magic:? the gathering|nasa|spacex|disney|ghibli|final fantasy|zelda|nintendo)\b/i;
    for (const t of [brick!, trading!, astronaut!, fantasy!, cityPop!, crochet!]) {
      expect(t.prompt).not.toMatch(brandRe);
      expect(enMessages[t.titleKey]).not.toMatch(brandRe);
    }
    expect(zhTWMessages[brick!.titleKey]).not.toMatch(/樂高/);
    expect(astronaut!.prompt).toMatch(/no agency logos/i);
    expect(fantasy!.prompt).toMatch(/real game titles|brand logos/i);
    expect(cityPop!.prompt).toMatch(/real artist names|album titles/i);
    expect(crochet!.prompt).toMatch(/trademarked toy brand/i);
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
    expect(enMessages['viral.show_more']).toMatch(/\{count\}/);
    expect(zhTWMessages['viral.show_more']).toMatch(/\{count\}/);
    expect(enMessages['viral.use_this_style']).toMatch(/Use this style/i);
    expect(zhTWMessages['viral.use_this_style']).toMatch(/用同款/);
    for (const cat of FILTER_CATEGORIES) {
      expect(enMessages[`viral.filter_${cat}`]).toBeTruthy();
      expect(zhTWMessages[`viral.filter_${cat}`]).toBeTruthy();
    }
  });
});
