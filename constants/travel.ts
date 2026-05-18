/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel photo: positive/negative templates and scene presets.
 * {SCENE} in the positive template is replaced by the scene prompt.
 * Domain types live in root types.ts; re-exported here for convenience.
 */

export type {
  TravelSceneGroup,
  TravelSceneCategory,
  TravelSceneRegion,
  TravelContinent,
  TravelVibe,
  TravelScene,
  TravelAspectRatio,
  TravelImageSize,
  TravelStyle,
  TravelWeather,
  TravelTimeOfDay,
  TravelVibeOption,
  TravelOutfit,
  TravelRelationship,
  TravelFraming,
  TravelPose,
} from '../types';

export {
  loadTravelSceneCatalog,
  pickRandomTravelScene,
  resetTravelSceneCatalogCache,
} from './travelScenesLoader';
export type { TravelSceneCatalog } from './travelScenesLoader';

/** Scene id for "random location" option. At generate time, one scene from the catalog is chosen randomly. */
export const TRAVEL_SCENE_ID_RANDOM = 'random';

/** Positive prompt template; {SCENE} is replaced by the selected scene prompt. */
export const TRAVEL_POSITIVE_TEMPLATE = `a travel photo of the same person, preserve identity, same face, same person,
realistic photo, photorealistic, high quality,
the person {SCENE},
natural lighting, natural colors, real world photography,
sharp focus, detailed, looks like a real photo`;

/** Negative prompt (fixed). */
export const TRAVEL_NEGATIVE = `different person, change face, change identity, face swap,
AI face, fake face, CGI, plastic skin,
anime, cartoon, illustration, painting,
low quality, blurry, deformed, distorted, extra fingers, bad anatomy`;

/** Output aspect ratio options. */
export const TRAVEL_ASPECT_RATIOS: { id: import('../types').TravelAspectRatio; nameKey: string }[] =
  [
    { id: '1:1', nameKey: 'travel.aspect_1_1' },
    { id: '16:9', nameKey: 'travel.aspect_16_9' },
    { id: '9:16', nameKey: 'travel.aspect_9_16' },
  ];

export const DEFAULT_TRAVEL_ASPECT = '1:1' as const satisfies import('../types').TravelAspectRatio;

/** Output image size. Flash: 1K only; Pro: 1K, 2K, 4K. */
export const TRAVEL_IMAGE_SIZES: {
  id: import('../types').TravelImageSize;
  nameKey: string;
  proOnly: boolean;
}[] = [
  { id: '1K', nameKey: 'travel.size_1k', proOnly: false },
  { id: '2K', nameKey: 'travel.size_2k', proOnly: true },
  { id: '4K', nameKey: 'travel.size_4k', proOnly: true },
];

export const DEFAULT_TRAVEL_IMAGE_SIZE = '1K' as const satisfies import('../types').TravelImageSize;

/** Travel photo style presets */
export const TRAVEL_STYLES: {
  id: import('../types').TravelStyle;
  nameKey: string;
  prompt: string;
}[] = [
  {
    id: 'natural',
    nameKey: 'travel.style.natural',
    prompt: 'soft natural lighting, photorealistic, clear details',
  },
  {
    id: 'golden_hour',
    nameKey: 'travel.style.golden_hour',
    prompt: 'golden hour sunlight, warm tones, cinematic lighting, glowing skin',
  },
  {
    id: 'film',
    nameKey: 'travel.style.film',
    prompt: 'shot on 35mm film, kodak portra 400, grainy texture, vintage feel, soft colors',
  },
  {
    id: 'vibrant',
    nameKey: 'travel.style.vibrant',
    prompt:
      'modern travel photography, instagram style, vibrant colors, high saturation, sharp focus',
  },
  {
    id: 'cinematic',
    nameKey: 'travel.style.cinematic',
    prompt:
      'moody cinematic lighting, dramatic atmosphere, deep shadows, professional color grading',
  },
];

export const DEFAULT_TRAVEL_STYLE = 'natural' as const satisfies import('../types').TravelStyle;

/** Weather conditions for AI prompt injection */
export const TRAVEL_WEATHER_OPTIONS: {
  id: import('../types').TravelWeather;
  nameKey: string;
  prompt: string;
  icon: string;
}[] = [
  { id: 'random', nameKey: 'travel.weather.random', prompt: '', icon: '🎲' },
  {
    id: 'sunny',
    nameKey: 'travel.weather.sunny',
    prompt: 'sunny day, clear blue sky, bright sunlight',
    icon: '☀️',
  },
  {
    id: 'rainy',
    nameKey: 'travel.weather.rainy',
    prompt: 'rainy day, wet streets, rain droplets, raindrops on skin',
    icon: '🌧️',
  },
  {
    id: 'snowy',
    nameKey: 'travel.weather.snowy',
    prompt: 'snowing, snow-covered ground, winter atmosphere, snowflakes',
    icon: '❄️',
  },
  {
    id: 'cloudy',
    nameKey: 'travel.weather.cloudy',
    prompt: 'overcast sky, soft diffused lighting, cloudy day',
    icon: '☁️',
  },
  {
    id: 'misty',
    nameKey: 'travel.weather.misty',
    prompt: 'misty morning, fog in background, mysterious atmosphere, soft haze',
    icon: '🌫️',
  },
];

/** Time of day for AI prompt injection */
export const TRAVEL_TIME_OPTIONS: {
  id: import('../types').TravelTimeOfDay;
  nameKey: string;
  prompt: string;
  icon: string;
}[] = [
  { id: 'random', nameKey: 'travel.time.random', prompt: '', icon: '🎲' },
  {
    id: 'dawn',
    nameKey: 'travel.time.dawn',
    prompt: 'early morning, soft dawn light, pastel sky',
    icon: '🌅',
  },
  {
    id: 'noon',
    nameKey: 'travel.time.noon',
    prompt: 'midday, high sun, bright and vibrant colors',
    icon: '☀️',
  },
  {
    id: 'sunset',
    nameKey: 'travel.time.sunset',
    prompt: 'golden hour, orange and pink sky, long shadows',
    icon: '🌇',
  },
  {
    id: 'night',
    nameKey: 'travel.time.night',
    prompt: 'at night, city lights, starry sky, dark atmosphere',
    icon: '🌙',
  },
];

/** Vibe / Emotion filters for AI prompt injection */
export const TRAVEL_VIBE_OPTIONS: import('../types').TravelVibeOption[] = [
  {
    id: 'zen',
    nameKey: 'travel.vibe.zen',
    prompt: 'peaceful, zen atmosphere, minimalist, calm',
    icon: '🧘',
  },
  {
    id: 'retro',
    nameKey: 'travel.vibe.retro',
    prompt: 'vintage aesthetic, 90s feel, nostalgic colors',
    icon: '📼',
  },
  {
    id: 'cyberpunk',
    nameKey: 'travel.vibe.cyberpunk',
    prompt: 'cyberpunk style, neon lights, high tech low life, rain-slicked streets',
    icon: '🌃',
  },
  {
    id: 'street',
    nameKey: 'travel.vibe.street',
    prompt: 'street style photography, candid moment, urban vibe',
    icon: '👟',
  },
  {
    id: 'elegant',
    nameKey: 'travel.vibe.elegant',
    prompt: 'elegant and sophisticated, high-end fashion magazine style',
    icon: '💎',
  },
  {
    id: 'adventure',
    nameKey: 'travel.vibe.adventure',
    prompt: 'adventurous spirit, hiking gear, exploring nature',
    icon: '🥾',
  },
  {
    id: 'cozy',
    nameKey: 'travel.vibe.cozy',
    prompt: 'warm and cozy, soft blankets, comfortable setting',
    icon: '☕',
  },
  {
    id: 'futuristic',
    nameKey: 'travel.vibe.futuristic',
    prompt: 'futuristic technology, sleek design, sci-fi atmosphere',
    icon: '🚀',
  },
  {
    id: 'romantic',
    nameKey: 'travel.vibe.romantic',
    prompt: 'romantic atmosphere, soft focus, warm heart-felt lighting',
    icon: '💖',
  },
];

/** Outfit options for AI prompt injection */
export const TRAVEL_OUTFIT_OPTIONS: {
  id: import('../types').TravelOutfit;
  nameKey: string;
  prompt: string;
  icon: string;
}[] = [
  { id: 'default', nameKey: 'travel.outfit.default', prompt: '', icon: '🧥' },
  {
    id: 'luxury',
    nameKey: 'travel.outfit.luxury',
    prompt:
      'quiet luxury style, exquisite high-end fashion, high-quality fabrics, sophisticated minimalist look, expensive accessories',
    icon: '💎',
  },
  {
    id: 'parisian',
    nameKey: 'travel.outfit.parisian',
    prompt:
      'effortless Parisian chic, beret, trench coat, striped tops, stylish and elegant French aesthetic',
    icon: '🍷',
  },
  {
    id: 'academic',
    nameKey: 'travel.outfit.academic',
    prompt:
      'dark academia aesthetic, turtleneck, wool blazers, scholarly look, intellectual and mysterious fashion',
    icon: '📜',
  },
  {
    id: 'y2k',
    nameKey: 'travel.outfit.y2k',
    prompt:
      'Y2K pop fashion, 2000s aesthetic, bright metallic colors, trendy cyber-pop look, youthful and bold',
    icon: '💖',
  },
  {
    id: 'vintage',
    nameKey: 'travel.outfit.vintage',
    prompt: 'exquisite vintage classic outfit, timeless elegance, retro high-fashion style',
    icon: '🕰️',
  },
  {
    id: 'street_chic',
    nameKey: 'travel.outfit.street_chic',
    prompt: 'streetwear chic, trendy urban high-fashion, stylish layering, modern influencer look',
    icon: '👟',
  },
  {
    id: 'preppy',
    nameKey: 'travel.outfit.preppy',
    prompt:
      'preppy style, clean-cut academic look, knitted sweaters, blazers, sophisticated and neat',
    icon: '🎓',
  },
  {
    id: 'boho',
    nameKey: 'travel.outfit.boho',
    prompt: 'exquisite boho-chic, artistic traveler style, flowy patterns, stylish textures',
    icon: '🎨',
  },
  {
    id: 'traditional',
    nameKey: 'travel.outfit.traditional',
    prompt:
      'wearing traditional ethnic clothing matching the local culture, high quality traditional garments',
    icon: '👘',
  },
  {
    id: 'winter',
    nameKey: 'travel.outfit.winter',
    prompt: 'wearing winter clothes, warm down jacket, scarf, gloves, beanie',
    icon: '🧥',
  },
  {
    id: 'summer',
    nameKey: 'travel.outfit.summer',
    prompt: 'wearing summer clothes, light summer dress, shorts and t-shirt, sunglasses',
    icon: '🕶️',
  },
  {
    id: 'hiking',
    nameKey: 'travel.outfit.hiking',
    prompt: 'wearing professional hiking gear, outdoor performance clothing, backpack',
    icon: '🥾',
  },
  {
    id: 'cyberpunk',
    nameKey: 'travel.outfit.cyberpunk',
    prompt: 'wearing techwear, cyberpunk fashion, neon accents, futuristic accessories',
    icon: '🧪',
  },
  { id: 'custom', nameKey: 'travel.custom', prompt: '', icon: '✍️' },
];

/** Relationship types for multi-person mode */
export const TRAVEL_RELATIONSHIP_OPTIONS: {
  id: import('../types').TravelRelationship;
  nameKey: string;
  prompt: string;
  icon: string;
}[] = [
  { id: 'default', nameKey: 'travel.relationship.default', prompt: '', icon: '👥' },
  {
    id: 'couple',
    nameKey: 'travel.relationship.couple',
    prompt: 'romantic couple, intimate and affectionate interaction',
    icon: '💑',
  },
  {
    id: 'family',
    nameKey: 'travel.relationship.family',
    prompt: 'family members, warm family atmosphere',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'friends',
    nameKey: 'travel.relationship.friends',
    prompt: 'close friends, casual and fun interaction',
    icon: '👯',
  },
  {
    id: 'siblings',
    nameKey: 'travel.relationship.siblings',
    prompt: 'siblings, playful and comfortable interaction',
    icon: '👫',
  },
  {
    id: 'parent_child',
    nameKey: 'travel.relationship.parent_child',
    prompt: 'parent and child, caring and protective interaction',
    icon: '👨‍👧',
  },
];

/** Camera framing options */
export const TRAVEL_FRAMING_OPTIONS: {
  id: import('../types').TravelFraming;
  nameKey: string;
  prompt: string;
  icon: string;
}[] = [
  { id: 'default', nameKey: 'travel.framing.default', prompt: '', icon: '📷' },
  {
    id: 'closeup',
    nameKey: 'travel.framing.closeup',
    prompt: 'close-up shot, face and upper body focus, intimate framing',
    icon: '🔍',
  },
  {
    id: 'portrait',
    nameKey: 'travel.framing.portrait',
    prompt: 'portrait shot, head to waist, classic travel photo framing',
    icon: '🖼️',
  },
  {
    id: 'full_body',
    nameKey: 'travel.framing.full_body',
    prompt: 'full body shot, entire person visible from head to toe',
    icon: '🧍',
  },
  {
    id: 'wide_angle',
    nameKey: 'travel.framing.wide_angle',
    prompt: 'wide angle shot, person and expansive background, cinematic composition',
    icon: '🌄',
  },
  {
    id: 'aerial',
    nameKey: 'travel.framing.aerial',
    prompt: 'aerial view, bird eye perspective, dramatic top-down angle',
    icon: '🚁',
  },
];

/** Outfit color presets */
export const OUTFIT_COLOR_PRESETS = [
  { id: 'red', nameKey: 'travel.color.red', prompt: 'deep red color', icon: '🔴' },
  { id: 'blue', nameKey: 'travel.color.blue', prompt: 'navy blue color', icon: '🔵' },
  { id: 'white', nameKey: 'travel.color.white', prompt: 'pure white color', icon: '⚪' },
  { id: 'black', nameKey: 'travel.color.black', prompt: 'elegant black color', icon: '⚫' },
  { id: 'beige', nameKey: 'travel.color.beige', prompt: 'soft beige color', icon: '🟤' },
  { id: 'pink', nameKey: 'travel.color.pink', prompt: 'soft pink color', icon: '🩷' },
  { id: 'green', nameKey: 'travel.color.green', prompt: 'forest green color', icon: '🟢' },
  { id: 'yellow', nameKey: 'travel.color.yellow', prompt: 'bright yellow color', icon: '🟡' },
];

/** Pose options for AI prompt injection */
export const TRAVEL_POSE_OPTIONS: {
  id: import('../types').TravelPose;
  nameKey: string;
  prompt: string;
  icon: string;
  minPeople?: number;
}[] = [
  {
    id: 'natural',
    nameKey: 'travel.pose.natural',
    prompt: 'standing naturally, relaxed pose',
    icon: '🚶',
  },
  {
    id: 'hugging',
    nameKey: 'travel.pose.hugging',
    prompt: 'hugging each other warmly, showing affection',
    icon: '🫂',
    minPeople: 2,
  },
  {
    id: 'jumping',
    nameKey: 'travel.pose.jumping',
    prompt: 'jumping in the air with joy, mid-air pose, arms raised',
    icon: '🤸',
  },
  {
    id: 'hand_in_hand',
    nameKey: 'travel.pose.hand_in_hand',
    prompt: 'holding hands, walking or standing together',
    icon: '🤝',
    minPeople: 2,
  },
  {
    id: 'pointing',
    nameKey: 'travel.pose.pointing',
    prompt: 'pointing towards the landmark or scenery in the background',
    icon: '👉',
  },
  {
    id: 'looking_at_each_other',
    nameKey: 'travel.pose.looking_at_each_other',
    prompt: 'looking at each other and smiling, eye contact',
    icon: '👀',
    minPeople: 2,
  },
  {
    id: 'peace_sign',
    nameKey: 'travel.pose.peace_sign',
    prompt: 'making a peace sign (V-sign) with hand, smiling at camera',
    icon: '✌️',
  },
  {
    id: 'walking_away',
    nameKey: 'travel.pose.walking_away',
    prompt: 'walking away from the camera, back view, looking towards the horizon',
    icon: '🚶‍♀️',
  },
  {
    id: 'sitting_relaxed',
    nameKey: 'travel.pose.sitting_relaxed',
    prompt: 'sitting relaxed on a ledge or bench, casual and comfortable posture',
    icon: '🪑',
  },
  {
    id: 'candid_laugh',
    nameKey: 'travel.pose.candid_laugh',
    prompt: 'captured in a candid laugh, spontaneous and happy expression, non-posed look',
    icon: '😆',
  },
  {
    id: 'leaning',
    nameKey: 'travel.pose.leaning',
    prompt: 'leaning stylishly against a wall or railing, cool and composed posture',
    icon: '🧱',
  },
  {
    id: 'coffee_time',
    nameKey: 'travel.pose.coffee_time',
    prompt: 'holding a coffee cup, looking casually at the camera, lifestyle photography vibe',
    icon: '☕',
  },
  {
    id: 'adjusting_shades',
    nameKey: 'travel.pose.adjusting_shades',
    prompt: 'stylishly adjusting sunglasses or looking over them, cool influencer pose',
    icon: '🕶️',
  },
  {
    id: 'cafe_sitting',
    nameKey: 'travel.pose.cafe_sitting',
    prompt: 'sitting at a cafe table, relaxing, gourmet travel vibe, lifestyle look',
    icon: '🍴',
  },
  {
    id: 'photographer',
    nameKey: 'travel.pose.photographer',
    prompt: 'holding a camera as if taking a photo, traveler vibe, artistic lifestyle',
    icon: '📷',
  },
  {
    id: 'heart',
    nameKey: 'travel.pose.heart',
    prompt: 'making a heart sign with hands or fingers, cute and friendly pose',
    icon: '🫶',
  },
  { id: 'custom', nameKey: 'travel.custom', prompt: '', icon: '✍️' },
];

/** Recommended vibes for specific location types */
export const LOCATION_RECOMMENDED_VIBES: Record<string, import('../types').TravelVibe[]> = {
  // Cities
  shibuya: ['cyberpunk', 'street', 'futuristic'],
  nyc: ['street', 'cyberpunk', 'elegant'],
  london: ['retro', 'street', 'elegant'],
  taipei101: ['cyberpunk', 'futuristic', 'street'],
  ximending: ['cyberpunk', 'street', 'retro'],
  eiffel: ['romantic', 'elegant', 'retro'],
  santorini: ['romantic', 'elegant', 'zen'],
  rome: ['retro', 'elegant', 'street'],
  venice: ['romantic', 'retro', 'elegant'],

  // Historical / Zen
  kyoto: ['zen', 'retro', 'romantic'],
  jiufen: ['retro', 'zen', 'romantic'],
  cks_memorial: ['zen', 'elegant', 'retro'],
  taj_mahal: ['elegant', 'zen', 'romantic'],
  pyramids: ['adventure', 'retro', 'elegant'],

  // Nature / Adventure
  iceland: ['adventure', 'zen', 'futuristic'],
  swiss_alps: ['adventure', 'cozy', 'zen'],
  mt_fuji: ['zen', 'adventure', 'romantic'],
  grand_canyon: ['adventure', 'zen'],
  taroko: ['adventure', 'zen'],
  hehuanshan: ['adventure', 'zen', 'cozy'],

  // Food
  food: ['cozy', 'street', 'elegant'],
};
