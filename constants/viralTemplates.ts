/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave O viral one-tap templates (玩法). Titles/descriptions live in i18n;
 * prompts stay English for model quality, with zh notes in locale files.
 */

export type ViralTemplateCategory = 'figurine' | 'polaroid' | 'era' | 'taiwan';

export type ViralTemplateFeature = 'generate' | 'retouch';

export interface ViralTemplate {
  id: string;
  category: ViralTemplateCategory;
  feature: ViralTemplateFeature;
  /** i18n keys */
  titleKey: string;
  descriptionKey: string;
  /** Thumbnail alt text (zh-TW + EN). */
  thumbnailAltKey: string;
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  quantity?: 1 | 2 | 3 | 4;
  tab?: 'retouch' | 'adjust' | 'filters';
  /** Path under public/ — dedicated viral preview, not a shared gallery asset. */
  thumbnail: string;
  tags: string[];
}

/** Shared/generic example assets that must not be reused as viral thumbnails. */
export const GENERIC_EXAMPLE_THUMBNAILS = new Set([
  'examples/portrait-1.webp',
  'examples/portrait-2.webp',
  'examples/editor-after.webp',
  'examples/editor-before.webp',
  'examples/generate-1.webp',
  'examples/generate-2.webp',
  'examples/travel-1.webp',
  'examples/travel-2.webp',
  'examples/idphoto-after.webp',
  'examples/idphoto-after-2.webp',
  'examples/idphoto-before.webp',
  'examples/tryon-after.webp',
  'examples/tryon-after-2.webp',
  'examples/tryon-before.webp',
]);

export const VIRAL_TEMPLATES: ViralTemplate[] = [
  {
    id: 'figurine-box',
    category: 'figurine',
    feature: 'retouch',
    titleKey: 'viral.figurine_box.title',
    descriptionKey: 'viral.figurine_box.desc',
    thumbnailAltKey: 'viral.figurine_box.thumb_alt',
    prompt:
      'Transform the person into a collectible 1/7 scale PVC figure in a window retail box. Clear plastic blister, cardboard backing with brand logo and character name, studio product lighting, sharp focus, photoreal toy photography.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/figurine-box.webp',
    tags: ['figurine', 'viral', 'toy'],
  },
  {
    id: 'polaroid-frame',
    category: 'polaroid',
    feature: 'retouch',
    titleKey: 'viral.polaroid.title',
    descriptionKey: 'viral.polaroid.desc',
    thumbnailAltKey: 'viral.polaroid.thumb_alt',
    prompt:
      'Restyle as an instant Polaroid photo: thick white border, soft flash lighting, slight vintage color cast, handwritten date in the bottom margin, intimate snapshot feel, film grain.',
    aspectRatio: '1:1',
    tab: 'retouch',
    thumbnail: 'examples/viral/polaroid.webp',
    tags: ['polaroid', 'viral', 'frame'],
  },
  {
    id: 'era-70s-taiwan',
    category: 'era',
    feature: 'retouch',
    titleKey: 'viral.era_70s.title',
    descriptionKey: 'viral.era_70s.desc',
    thumbnailAltKey: 'viral.era_70s.thumb_alt',
    prompt:
      'Time-travel the portrait to 1970s Taiwan: Kodachrome warmth, soft flash, period clothing and hair, modest apartment or street backdrop of that era, nostalgic documentary photo, subtle film grain.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/era-70s-taiwan.webp',
    tags: ['era', '1970s', 'taiwan'],
  },
  {
    id: 'era-80s-taiwan',
    category: 'era',
    feature: 'retouch',
    titleKey: 'viral.era_80s.title',
    descriptionKey: 'viral.era_80s.desc',
    thumbnailAltKey: 'viral.era_80s.thumb_alt',
    prompt:
      'Time-travel the portrait to 1980s Taiwan: neon night markets, big hair, pastel windbreaker vibes, flash-lit night snapshot, VHS softness, nostalgic Taipei evening atmosphere.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/era-80s-taiwan.webp',
    tags: ['era', '1980s', 'taiwan'],
  },
  {
    id: 'era-90s-taiwan',
    category: 'era',
    feature: 'retouch',
    titleKey: 'viral.era_90s.title',
    descriptionKey: 'viral.era_90s.desc',
    thumbnailAltKey: 'viral.era_90s.thumb_alt',
    prompt:
      'Time-travel the portrait to 1990s Taiwan: disposable-camera look, school uniform or casual 90s streetwear, karaoke or night market glow, slightly overexposed flash, millennial nostalgia.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/era-90s-taiwan.webp',
    tags: ['era', '1990s', 'taiwan'],
  },
  {
    id: 'taiwan-night-market',
    category: 'taiwan',
    feature: 'retouch',
    titleKey: 'viral.taiwan_night_market.title',
    descriptionKey: 'viral.taiwan_night_market.desc',
    thumbnailAltKey: 'viral.taiwan_night_market.thumb_alt',
    prompt:
      'Place the person naturally at a bustling Taiwan night market: red lanterns, steam from food stalls, neon signage, crowded aisle, warm tungsten and neon mix, candid travel photo, photorealistic.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/taiwan-night-market.webp',
    tags: ['taiwan', 'night-market', 'travel'],
  },
  {
    id: 'taiwan-jiufen',
    category: 'taiwan',
    feature: 'retouch',
    titleKey: 'viral.taiwan_jiufen.title',
    descriptionKey: 'viral.taiwan_jiufen.desc',
    thumbnailAltKey: 'viral.taiwan_jiufen.thumb_alt',
    prompt:
      'Place the person on the misty lantern-lit steps of Jiufen Old Street, Taiwan: tea-house rooftops, orange lanterns in fog, cool dusk light, cinematic travel portrait, photorealistic.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/taiwan-jiufen.webp',
    tags: ['taiwan', 'jiufen', 'travel'],
  },
  {
    id: 'taiwan-101',
    category: 'taiwan',
    feature: 'retouch',
    titleKey: 'viral.taiwan_101.title',
    descriptionKey: 'viral.taiwan_101.desc',
    thumbnailAltKey: 'viral.taiwan_101.thumb_alt',
    prompt:
      'Place the person at a Taipei viewpoint with Taipei 101 glowing in the skyline behind them at blue hour, clean city lights bokeh, stylish travel portrait, photorealistic.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/taiwan-101.webp',
    tags: ['taiwan', 'taipei-101', 'skyline'],
  },
];

export function getViralTemplateById(id: string): ViralTemplate | undefined {
  return VIRAL_TEMPLATES.find((t) => t.id === id);
}

export const VIRAL_TEMPLATE_IDS = new Set(VIRAL_TEMPLATES.map((t) => t.id));
