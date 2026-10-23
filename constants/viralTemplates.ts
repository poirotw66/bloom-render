/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Viral one-tap templates (玩法). Titles/descriptions live in i18n;
 * prompts stay English for model quality, with zh notes in locale files.
 */

export type ViralTemplateCategory =
  | 'figurine'
  | 'polaroid'
  | 'era'
  | 'taiwan'
  | 'toy'
  | 'art'
  | 'retro'
  | 'social'
  | 'costume';

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
  {
    id: 'chibi-3d',
    category: 'toy',
    feature: 'retouch',
    titleKey: 'viral.chibi_3d.title',
    descriptionKey: 'viral.chibi_3d.desc',
    thumbnailAltKey: 'viral.chibi_3d.thumb_alt',
    prompt:
      'Transform the person into a cute 3D chibi vinyl figure with an oversized head and short body, standing on a simple round base. Soft pastel studio backdrop, clean product lighting, smooth toy plastic material, charming collectible look, photoreal toy photography.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/chibi-3d.webp',
    tags: ['toy', 'chibi', '3d', 'viral'],
  },
  {
    id: 'line-stickers',
    category: 'social',
    feature: 'retouch',
    titleKey: 'viral.line_stickers.title',
    descriptionKey: 'viral.line_stickers.desc',
    thumbnailAltKey: 'viral.line_stickers.thumb_alt',
    prompt:
      'Turn the person into a 3x3 messenger sticker sheet: nine cartoon expressions of the same character (happy, sad, angry, surprised, love, sleepy, cheering, wink, shy), thick white outline, flat pastel colors, clean white background, no readable text or logos, sticker-pack product layout.',
    aspectRatio: '1:1',
    tab: 'retouch',
    thumbnail: 'examples/viral/line-stickers.webp',
    tags: ['social', 'stickers', 'cartoon', 'viral'],
  },
  {
    id: 'acrylic-standee',
    category: 'toy',
    feature: 'retouch',
    titleKey: 'viral.acrylic_standee.title',
    descriptionKey: 'viral.acrylic_standee.desc',
    thumbnailAltKey: 'viral.acrylic_standee.thumb_alt',
    prompt:
      'Transform the person into an anime-styled die-cut acrylic standee on a clear plastic base, standing on a desk. Glossy transparent acrylic edges, colorful character art of the subject, soft room lighting, shallow depth of field, product photography.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/acrylic-standee.webp',
    tags: ['toy', 'acrylic', 'anime', 'viral'],
  },
  {
    id: 'pixel-art',
    category: 'retro',
    feature: 'retouch',
    titleKey: 'viral.pixel_art.title',
    descriptionKey: 'viral.pixel_art.desc',
    thumbnailAltKey: 'viral.pixel_art.thumb_alt',
    prompt:
      'Restyle the person as a 16-bit pixel-art game character sprite sheet: clear walk-cycle frames side by side, limited retro color palette, chunky pixels, placed in a simple side-scrolling retro game scene background, nostalgic console-era look, no readable UI text.',
    aspectRatio: '1:1',
    tab: 'retouch',
    thumbnail: 'examples/viral/pixel-art.webp',
    tags: ['retro', 'pixel', 'game', 'viral'],
  },
  {
    id: 'claymation',
    category: 'art',
    feature: 'retouch',
    titleKey: 'viral.claymation.title',
    descriptionKey: 'viral.claymation.desc',
    thumbnailAltKey: 'viral.claymation.thumb_alt',
    prompt:
      'Restyle the portrait as plasticine stop-motion claymation: visible fingerprint texture in the clay, soft handmade facial features, miniature set with crafts-table lighting, whimsical stop-motion film still, tactile material detail.',
    aspectRatio: '4:3',
    tab: 'retouch',
    thumbnail: 'examples/viral/claymation.webp',
    tags: ['art', 'clay', 'stop-motion', 'viral'],
  },
  {
    id: 'ukiyo-e',
    category: 'art',
    feature: 'retouch',
    titleKey: 'viral.ukiyo_e.title',
    descriptionKey: 'viral.ukiyo_e.desc',
    thumbnailAltKey: 'viral.ukiyo_e.thumb_alt',
    prompt:
      'Restyle the portrait as a Japanese ukiyo-e woodblock print: bold outlines, flat color fields, the Great Wave and Mount Fuji in the background, washi paper texture, Edo-period print aesthetic, refined traditional composition.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/ukiyo-e.webp',
    tags: ['art', 'ukiyo-e', 'print', 'viral'],
  },
  {
    id: 'hk-90s-film',
    category: 'retro',
    feature: 'retouch',
    titleKey: 'viral.hk_90s_film.title',
    descriptionKey: 'viral.hk_90s_film.desc',
    thumbnailAltKey: 'viral.hk_90s_film.thumb_alt',
    prompt:
      'Restyle as a 1990s Hong Kong film still: rainy neon street at night, saturated green and red neon reflections on wet asphalt, heavy film grain, dramatic cinematic lighting, period fashion, moody crime-drama atmosphere, photoreal movie frame.',
    aspectRatio: '4:3',
    tab: 'retouch',
    thumbnail: 'examples/viral/hk-90s-film.webp',
    tags: ['retro', 'hong-kong', 'film', 'viral'],
  },
  {
    id: 'magazine-cover',
    category: 'social',
    feature: 'retouch',
    titleKey: 'viral.magazine_cover.title',
    descriptionKey: 'viral.magazine_cover.desc',
    thumbnailAltKey: 'viral.magazine_cover.thumb_alt',
    prompt:
      "Transform into a glossy fashion magazine cover: confident editorial pose, studio beauty lighting, sharp retouch. Use a clearly fictional masthead name and invented cover lines only — do not use real magazine brands, real celebrities' names, barcodes, QR codes, or trademarks. Clean magazine layout, 3:4 cover crop.",
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/magazine-cover.webp',
    tags: ['social', 'magazine', 'fashion', 'viral'],
  },
  {
    id: 'purikura',
    category: 'social',
    feature: 'retouch',
    titleKey: 'viral.purikura.title',
    descriptionKey: 'viral.purikura.desc',
    thumbnailAltKey: 'viral.purikura.thumb_alt',
    prompt:
      'Restyle as a Japanese purikura photo-booth strip: cute close-up faces, sparkles and heart stickers, pink decorative frame, soft beauty filter, playful kawaii decorations, multi-frame booth layout feel, bright pastel colors.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/purikura.webp',
    tags: ['social', 'purikura', 'kawaii', 'viral'],
  },
  {
    id: 'brick-minifig',
    category: 'toy',
    feature: 'retouch',
    titleKey: 'viral.brick_minifig.title',
    descriptionKey: 'viral.brick_minifig.desc',
    thumbnailAltKey: 'viral.brick_minifig.thumb_alt',
    prompt:
      'Transform the person into a plastic building-brick minifigure toy: cylindrical head, C-shaped hands, blocky torso printed with a simplified face and outfit inspired by the subject, standing on a studded baseplate, bright studio product shot, clean toy plastic materials. Do not use any trademarked brand names or logos.',
    aspectRatio: '1:1',
    tab: 'retouch',
    thumbnail: 'examples/viral/brick-minifig.webp',
    tags: ['toy', 'brick', 'minifigure', 'viral'],
  },
  {
    id: 'pro-headshot',
    category: 'social',
    feature: 'retouch',
    titleKey: 'viral.pro_headshot.title',
    descriptionKey: 'viral.pro_headshot.desc',
    thumbnailAltKey: 'viral.pro_headshot.thumb_alt',
    prompt:
      'Create a polished corporate headshot of the person: navy business suit, neat grooming, soft professional studio lighting, gently blurred modern office background, confident friendly expression, LinkedIn-ready portrait, photorealistic.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/pro-headshot.webp',
    tags: ['social', 'headshot', 'professional', 'viral'],
  },
  {
    id: 'anime-handpainted',
    category: 'art',
    feature: 'retouch',
    titleKey: 'viral.anime_handpainted.title',
    descriptionKey: 'viral.anime_handpainted.desc',
    thumbnailAltKey: 'viral.anime_handpainted.thumb_alt',
    prompt:
      'Restyle the person as a hand-painted anime-film illustration in a countryside scene: soft watercolor backgrounds, gentle cel-shaded character rendering, warm afternoon light, pastoral hills and sky, painterly traditional animation look. Do not reference any real animation studio or film title.',
    aspectRatio: '4:3',
    tab: 'retouch',
    thumbnail: 'examples/viral/anime-handpainted.webp',
    tags: ['art', 'anime', 'handpainted', 'viral'],
  },
  {
    id: 'pet-human',
    category: 'social',
    feature: 'retouch',
    titleKey: 'viral.pet_human.title',
    descriptionKey: 'viral.pet_human.desc',
    thumbnailAltKey: 'viral.pet_human.thumb_alt',
    prompt:
      'Anthropomorphize the pet in the photo into a realistic human portrait whose hair/fur color, eye color, and expression match the pet. Show a clear side-by-side composition: original pet on one side and the matching human portrait on the other, soft natural lighting, photorealistic.',
    aspectRatio: '4:3',
    tab: 'retouch',
    thumbnail: 'examples/viral/pet-human.webp',
    tags: ['social', 'pet', 'anthropomorphic', 'viral'],
  },
  {
    id: 'comic-pop-art',
    category: 'art',
    feature: 'retouch',
    titleKey: 'viral.comic_pop_art.title',
    descriptionKey: 'viral.comic_pop_art.desc',
    thumbnailAltKey: 'viral.comic_pop_art.thumb_alt',
    prompt:
      'Restyle as American comic pop art: bold black outlines, Ben-Day/halftone dots, saturated primary colors, dynamic comic-book portrait, empty speech bubble with no readable text or letters, graphic novel cover energy.',
    aspectRatio: '1:1',
    tab: 'retouch',
    thumbnail: 'examples/viral/comic-pop-art.webp',
    tags: ['art', 'comic', 'pop-art', 'viral'],
  },
  {
    id: 'tarot-card',
    category: 'art',
    feature: 'retouch',
    titleKey: 'viral.tarot_card.title',
    descriptionKey: 'viral.tarot_card.desc',
    thumbnailAltKey: 'viral.tarot_card.thumb_alt',
    prompt:
      'Transform into an ornate tarot card titled The Star: the person as the central figure, gold filigree border, mystical celestial symbols, rich jewel tones, aged card stock texture, vertical tarot layout, no modern logos.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/tarot-card.webp',
    tags: ['art', 'tarot', 'mystical', 'viral'],
  },
  {
    id: 'vintage-travel-poster',
    category: 'retro',
    feature: 'retouch',
    titleKey: 'viral.vintage_travel_poster.title',
    descriptionKey: 'viral.vintage_travel_poster.desc',
    thumbnailAltKey: 'viral.vintage_travel_poster.thumb_alt',
    prompt:
      'Restyle as a 1950s vintage travel poster: gouache flat colors, simplified shapes, the person as the stylish traveler in the foreground, scenic landmark backdrop, classic mid-century poster typography that remains decorative and unreadable as real brand text, slightly aged paper.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/vintage-travel-poster.webp',
    tags: ['retro', 'poster', 'travel', 'viral'],
  },
  {
    id: 'trading-card',
    category: 'toy',
    feature: 'retouch',
    titleKey: 'viral.trading_card.title',
    descriptionKey: 'viral.trading_card.desc',
    thumbnailAltKey: 'viral.trading_card.thumb_alt',
    prompt:
      'Transform into a fantasy holographic trading card of the person as a character: ornate frame, shimmering holo foil effect, fictional ATK and DEF numbers, elemental energy accents, collectible card layout. Do not use any real game titles, brand names, or logos.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/trading-card.webp',
    tags: ['toy', 'trading-card', 'fantasy', 'viral'],
  },
  {
    id: 'yukata-festival',
    category: 'costume',
    feature: 'retouch',
    titleKey: 'viral.yukata_festival.title',
    descriptionKey: 'viral.yukata_festival.desc',
    thumbnailAltKey: 'viral.yukata_festival.thumb_alt',
    prompt:
      'Dress the person in a colorful Japanese yukata at a summer festival at dusk: paper lanterns, festival stalls soft-focused behind, warm evening light, hair ornament, photorealistic travel portrait.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/yukata-festival.webp',
    tags: ['costume', 'yukata', 'festival', 'viral'],
  },
  {
    id: 'wuxia-costume',
    category: 'costume',
    feature: 'retouch',
    titleKey: 'viral.wuxia_costume.title',
    descriptionKey: 'viral.wuxia_costume.desc',
    thumbnailAltKey: 'viral.wuxia_costume.thumb_alt',
    prompt:
      'Restyle as a wuxia film still: the person as a swordsman or swordswoman in flowing historical Chinese robes, bamboo forest mist, cool cinematic lighting, dramatic pose with a jian sword, photorealistic costume drama look. Do not use real TV show or film titles.',
    aspectRatio: '4:3',
    tab: 'retouch',
    thumbnail: 'examples/viral/wuxia-costume.webp',
    tags: ['costume', 'wuxia', 'period', 'viral'],
  },
  {
    id: 'y2k-digicam',
    category: 'retro',
    feature: 'retouch',
    titleKey: 'viral.y2k_digicam.title',
    descriptionKey: 'viral.y2k_digicam.desc',
    thumbnailAltKey: 'viral.y2k_digicam.thumb_alt',
    prompt:
      'Restyle as an early-2000s compact digital camera snapshot: harsh on-camera flash, slight red-eye risk, low dynamic range, cool indoor night vibe, orange LCD date stamp in a corner (fictional date), candid Y2K party aesthetic, photorealistic.',
    aspectRatio: '4:3',
    tab: 'retouch',
    thumbnail: 'examples/viral/y2k-digicam.webp',
    tags: ['retro', 'y2k', 'digicam', 'viral'],
  },
  {
    id: 'astronaut',
    category: 'costume',
    feature: 'retouch',
    titleKey: 'viral.astronaut.title',
    descriptionKey: 'viral.astronaut.desc',
    thumbnailAltKey: 'viral.astronaut.thumb_alt',
    prompt:
      'Transform into an astronaut portrait inside a spacecraft: reflective helmet visor optional or open, Earth visible through the window behind them, soft cabin lighting. Use a plain white spacesuit with no agency logos, national flags, mission patches, or brand markings.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/astronaut.webp',
    tags: ['costume', 'astronaut', 'space', 'viral'],
  },
  {
    id: 'iso-diorama',
    category: 'toy',
    feature: 'retouch',
    titleKey: 'viral.iso_diorama.title',
    descriptionKey: 'viral.iso_diorama.desc',
    thumbnailAltKey: 'viral.iso_diorama.thumb_alt',
    prompt:
      'Place the person inside a tiny isometric 3D room diorama: cutaway dollhouse view, desk and cozy furniture, soft miniature lighting, cute scale model materials, clean isometric camera angle, photoreal miniature photography.',
    aspectRatio: '1:1',
    tab: 'retouch',
    thumbnail: 'examples/viral/iso-diorama.webp',
    tags: ['toy', 'diorama', 'isometric', 'viral'],
  },
  {
    id: 'yearbook-90s',
    category: 'retro',
    feature: 'retouch',
    titleKey: 'viral.yearbook_90s.title',
    descriptionKey: 'viral.yearbook_90s.desc',
    thumbnailAltKey: 'viral.yearbook_90s.thumb_alt',
    prompt:
      'Restyle as a 1990s school yearbook portrait: classic mottled blue studio backdrop, soft butterfly lighting, period hair and clothing, printed yearbook crop with a simple caption reading CLASS OF 1996 under the photo, nostalgic yearbook print texture.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/yearbook-90s.webp',
    tags: ['retro', 'yearbook', '1990s', 'viral'],
  },
  {
    id: 'stained-glass',
    category: 'art',
    feature: 'retouch',
    titleKey: 'viral.stained_glass.title',
    descriptionKey: 'viral.stained_glass.desc',
    thumbnailAltKey: 'viral.stained_glass.thumb_alt',
    prompt:
      'Restyle the portrait as a gothic stained-glass window: leaded black outlines, jewel-toned translucent glass panes, cathedral window frame, luminous backlight as if sun through glass, sacred art composition.',
    aspectRatio: '3:4',
    tab: 'retouch',
    thumbnail: 'examples/viral/stained-glass.webp',
    tags: ['art', 'stained-glass', 'gothic', 'viral'],
  },
];

export function getViralTemplateById(id: string): ViralTemplate | undefined {
  return VIRAL_TEMPLATES.find((t) => t.id === id);
}

export const VIRAL_TEMPLATE_IDS = new Set(VIRAL_TEMPLATES.map((t) => t.id));
