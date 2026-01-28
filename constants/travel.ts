/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel photo: positive/negative templates and scene presets.
 * {SCENE} in the positive template is replaced by the scene prompt.
 */

export type TravelSceneGroup = 'international' | 'taiwan';

export interface TravelScene {
  id: string;
  nameKey: string;
  prompt: string;
  group: TravelSceneGroup;
}

/** International travel scenes */
export const TRAVEL_SCENES_INTERNATIONAL: TravelScene[] = [
  { id: 'shibuya', nameKey: 'travel.scene.shibuya', prompt: 'in Shibuya, Tokyo, busy street, city background, travel photography', group: 'international' },
  { id: 'eiffel', nameKey: 'travel.scene.eiffel', prompt: 'in front of the Eiffel Tower, Paris, travel photography, daytime', group: 'international' },
  { id: 'iceland', nameKey: 'travel.scene.iceland', prompt: 'in Iceland, dramatic mountains, waterfall, nature landscape, travel photography', group: 'international' },
  { id: 'santorini', nameKey: 'travel.scene.santorini', prompt: 'in Santorini, Greece, white and blue buildings, sea, sunny day, travel photography', group: 'international' },
  { id: 'nyc', nameKey: 'travel.scene.nyc', prompt: 'in New York City, Times Square, city street, travel photography', group: 'international' },
];

/** Taiwan round-island scenes */
export const TRAVEL_SCENES_TAIWAN: TravelScene[] = [
  { id: 'taipei101', nameKey: 'travel.scene.taipei101', prompt: 'in front of Taipei 101, Taipei, Taiwan, city skyline, daytime, travel photography', group: 'taiwan' },
  { id: 'jiufen', nameKey: 'travel.scene.jiufen', prompt: 'in Jiufen old street, Taiwan, lanterns, mountain town, rainy atmosphere, travel photography', group: 'taiwan' },
  { id: 'kenting', nameKey: 'travel.scene.kenting', prompt: 'in Kenting beach, Taiwan, tropical beach, blue sea, sunny day, travel photography', group: 'taiwan' },
  { id: 'sunmoonlake', nameKey: 'travel.scene.sunmoonlake', prompt: 'at Sun Moon Lake, Taiwan, lake, mountains, peaceful scenery, travel photography', group: 'taiwan' },
  { id: 'alishan', nameKey: 'travel.scene.alishan', prompt: 'in Alishan, Taiwan, forest, sea of clouds, sunrise, mountain scenery, travel photography', group: 'taiwan' },
  { id: 'tainan', nameKey: 'travel.scene.tainan', prompt: 'in Tainan old street, Taiwan, traditional architecture, historical city, travel photography', group: 'taiwan' },
  { id: 'taroko', nameKey: 'travel.scene.taroko', prompt: 'in Taroko Gorge, Taiwan, marble canyon, river, dramatic mountains, travel photography', group: 'taiwan' },
  { id: 'ximending', nameKey: 'travel.scene.ximending', prompt: 'in Ximending, Taipei, Taiwan, city street, neon signs, urban scene, travel photography', group: 'taiwan' },
];

export const TRAVEL_SCENES: TravelScene[] = [...TRAVEL_SCENES_INTERNATIONAL, ...TRAVEL_SCENES_TAIWAN];

/** Scene id for "random location" option. At generate time, one of TRAVEL_SCENES is chosen randomly. */
export const TRAVEL_SCENE_ID_RANDOM = 'random';

/** Picks a random scene from TRAVEL_SCENES. Used when TRAVEL_SCENE_ID_RANDOM is selected. */
export function pickRandomTravelScene(): TravelScene {
  const i = Math.floor(Math.random() * TRAVEL_SCENES.length);
  return TRAVEL_SCENES[i];
}

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
export type TravelAspectRatio = '1:1' | '16:9' | '9:16';

export const TRAVEL_ASPECT_RATIOS: { id: TravelAspectRatio; nameKey: string }[] = [
  { id: '1:1', nameKey: 'travel.aspect_1_1' },
  { id: '16:9', nameKey: 'travel.aspect_16_9' },
  { id: '9:16', nameKey: 'travel.aspect_9_16' },
];

export const DEFAULT_TRAVEL_ASPECT: TravelAspectRatio = '1:1';

/** Output image size. Flash: 1K only; Pro: 1K, 2K, 4K. */
export type TravelImageSize = '1K' | '2K' | '4K';

export const TRAVEL_IMAGE_SIZES: { id: TravelImageSize; nameKey: string; proOnly: boolean }[] = [
  { id: '1K', nameKey: 'travel.size_1k', proOnly: false },
  { id: '2K', nameKey: 'travel.size_2k', proOnly: true },
  { id: '4K', nameKey: 'travel.size_4k', proOnly: true },
];

export const DEFAULT_TRAVEL_IMAGE_SIZE: TravelImageSize = '1K';
