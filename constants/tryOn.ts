/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Try-on background and style options for catalog-style, fashionable output.
 */

export type TryOnBackgroundId =
  | 'studio'
  | 'rural_equestrian'
  | 'winter_mountain'
  | 'luxury_travel'
  | 'urban_sporty'
  | 'minimal_editorial'
  | 'cafe_terrace'
  | 'modern_loft'
  | 'beach_club'
  | 'street_vibe'
  | 'library'
  | 'garden'
  | 'taiwan_night_market'
  | 'taipei_city_street'
  | 'old_street_jiufen';

export type TryOnStyleId =
  | 'equestrian_chic'
  | 'winter_wonderland'
  | 'luxury_travel'
  | 'sporty_chic'
  | 'editorial_high'
  | 'athleisure'
  | 'street_cool'
  | 'old_money'
  | 'minimalist'
  | 'boho_luxury'
  | 'cyber_tech'
  | 'soft_glam';

export interface TryOnBackgroundOption {
  id: TryOnBackgroundId;
  nameKey: string;
  promptHint: string;
  emoji: string;
}

export interface TryOnStyleOption {
  id: TryOnStyleId;
  nameKey: string;
  promptHint: string;
  emoji: string;
}

export const TRYON_BACKGROUNDS: TryOnBackgroundOption[] = [
  {
    id: 'studio',
    nameKey: 'tryon.background.studio',
    emoji: 'stud',
    promptHint:
      'Clean, professional studio setting. Neutral seamless backdrop or soft gradient. Even, flattering lighting. High-end catalog look.', // taste-skill-ignore
  },
  {
    id: 'rural_equestrian',
    nameKey: 'tryon.background.rural_equestrian',
    emoji: 'eqst',
    promptHint:
      'Rustic rural or equestrian setting. Classic Land Rover Defender, wooden barn or stable, dirt or gravel. Sophisticated outdoor, aspirational lifestyle.',
  },
  {
    id: 'winter_mountain',
    nameKey: 'tryon.background.winter_mountain',
    emoji: 'mtn',
    promptHint:
      'Picturesque winter scene. Snow-covered ground, mountains in the distance, evergreen trees. Clear sky. Winter wonderland, cozy yet chic.',
  },
  {
    id: 'luxury_travel',
    nameKey: 'tryon.background.luxury_travel',
    emoji: 'lux',
    promptHint:
      'Luxury travel setting. Premium SUV (e.g. black G-Wagen) with door open, lush foliage, autumn tones. Travel-ready, aspirational and desirable.',
  },
  {
    id: 'urban_sporty',
    nameKey: 'tryon.background.urban_sporty',
    emoji: 'urb',
    promptHint:
      'Urban, sporty backdrop. Luxury car or modern architecture. Upscale outdoor feel. Active lifestyle, dynamic and fashionable.',
  },
  {
    id: 'minimal_editorial',
    nameKey: 'tryon.background.minimal_editorial',
    emoji: 'edit',
    promptHint:
      'Minimal, high-end editorial. Soft shadows, clean lines, premium magazine style. Focus on the outfit, covetable and luxurious.',
  },
  {
    id: 'cafe_terrace',
    nameKey: 'tryon.background.cafe_terrace',
    emoji: 'cafe',
    promptHint:
      'Chic European cafe terrace. Marble tables, bistro chairs, blurred street background. Sunny afternoon lighting, Parisian vibe.',
  },
  {
    id: 'modern_loft',
    nameKey: 'tryon.background.modern_loft',
    emoji: 'loft',
    promptHint:
      'Modern industrial loft. Exposed brick, large windows, minimalist furniture. Natural soft-box lighting. Clean and urban.',
  },
  {
    id: 'beach_club',
    nameKey: 'tryon.background.beach_club',
    emoji: 'beach',
    promptHint:
      'Exclusive beach club. White umbrellas, turquoise water, premium sun loungers. High-key tropical lighting. Luxury vacation feel.',
  },
  {
    id: 'street_vibe',
    nameKey: 'tryon.background.street_vibe',
    emoji: 'strt',
    promptHint:
      'Vibrant New York or London street. Classic architecture, yellow cabs or red buses in bokeh. Dynamic urban energy.',
  },
  {
    id: 'library',
    nameKey: 'tryon.background.library',
    emoji: 'lib',
    promptHint:
      'Grand classical library. Dark wood shelves, leather books, warm brass lamps. Sophisticated, intellectual, and quiet luxury.',
  },
  {
    id: 'garden',
    nameKey: 'tryon.background.garden',
    emoji: 'gdn',
    promptHint:
      'Elegant manicured garden. Manicured hedges, blooming roses, stone path. Soft natural light. Romantic and refined.',
  },
  {
    id: 'taiwan_night_market',
    nameKey: 'tryon.background.taiwan_night_market',
    emoji: 'mkt',
    promptHint:
      'Vibrant Taiwan night market. Glowing neon signs in Traditional Chinese, street food stalls, bustling atmosphere, colorful lanterns. Dynamic and local vibe.',
  },
  {
    id: 'taipei_city_street',
    nameKey: 'tryon.background.taipei_city_street',
    emoji: 'tpe',
    promptHint:
      'Modern Taipei city street. Iconic architecture (like Taipei 101 in the distance), scooters parked on the side, clean urban design with local character.',
  },
  {
    id: 'old_street_jiufen',
    nameKey: 'tryon.background.old_street_jiufen',
    emoji: 'old',
    promptHint:
      'Traditional Taiwan old street like Jiufen. Red lanterns, narrow stone-paved alleys, tea houses, historic wooden architecture. Atmospheric and nostalgic.',
  },
];

export const TRYON_STYLES: TryOnStyleOption[] = [
  {
    id: 'equestrian_chic',
    nameKey: 'tryon.style.equestrian_chic',
    emoji: 'eq',
    promptHint:
      'Equestrian chic. Form-fitting activewear, confident stance. Sophisticated, active yet refined. Makes people want to buy.',
  },
  {
    id: 'winter_wonderland',
    nameKey: 'tryon.style.winter_wonderland',
    emoji: 'win',
    promptHint:
      'Winter wonderland fashion. Layered pieces, cozy yet chic. Fluffy accessories, warm boots. Aspirational winter style.',
  },
  {
    id: 'luxury_travel',
    nameKey: 'tryon.style.luxury_travel',
    emoji: 'lux',
    promptHint:
      'Luxury travel athleisure. Coordinated outfit, travel-ready, premium feel. Sophisticated and desirable.',
  },
  {
    id: 'sporty_chic',
    nameKey: 'tryon.style.sporty_chic',
    emoji: 'spt',
    promptHint:
      'Sporty chic. Tennis or active lifestyle vibe. Coordinated set, white sneakers, dynamic pose. Energetic and fashionable.',
  },
  {
    id: 'editorial_high',
    nameKey: 'tryon.style.editorial_high',
    emoji: 'edhi',
    promptHint:
      'High fashion editorial. Magazine-cover quality. Striking pose, covetable look. Very fashionable, makes people want to buy.',
  },
  {
    id: 'athleisure',
    nameKey: 'tryon.style.athleisure',
    emoji: 'ath',
    promptHint:
      'Modern athleisure. Comfortable yet stylish. Lifestyle shot that feels aspirational and on-trend.',
  },
  {
    id: 'street_cool',
    nameKey: 'tryon.style.street_cool',
    emoji: 'cool',
    promptHint:
      'Street cool. Oversized silhouettes, edgy attitude, urban accessories. Effortlessly stylish and trending.', // taste-skill-ignore
  },
  {
    id: 'old_money',
    nameKey: 'tryon.style.old_money',
    emoji: 'oldm',
    promptHint:
      'Old money aesthetic. Quiet luxury, timeless staples, impeccably tailored. Refined, wealthy, and understated.',
  },
  {
    id: 'minimalist',
    nameKey: 'tryon.style.minimalist',
    emoji: 'min',
    promptHint:
      'Minimalist sleek. Monochromatic palette, clean lines, premium fabrics. Intelligent and high-end modern look.',
  },
  {
    id: 'boho_luxury',
    nameKey: 'tryon.style.boho_luxury',
    emoji: 'boho',
    promptHint:
      'Boho luxury. Artistic patterns, flowing fabrics, premium jewelry. Free-spirited yet sophisticated and expensive.',
  },
  {
    id: 'cyber_tech',
    nameKey: 'tryon.style.cyber_tech',
    emoji: 'cyber',
    promptHint:
      'Cybertech future. Technical fabrics, neon accents, futuristic silhouette. High-performance and avant-garde.',
  },
  {
    id: 'soft_glam',
    nameKey: 'tryon.style.soft_glam',
    emoji: 'glam',
    promptHint:
      'Soft glamour. Feminine details, luxurious textures, warm flattering glow. Elegant, approachable, and premium.',
  },
];

export const DEFAULT_TRYON_BACKGROUND: TryOnBackgroundId = 'studio';
export const DEFAULT_TRYON_STYLE: TryOnStyleId = 'editorial_high';
