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
  x?: number; // percentage from left
  y?: number; // percentage from top
  /** 
   * Optional path to a real photo of the scene (in public/images/scenes/).
   * If provided/uncommented, this photo will be used as a reference to improve realism.
   */
  referenceImagePath?: string;
}

/** International travel scenes */
export const TRAVEL_SCENES_INTERNATIONAL: TravelScene[] = [
  { id: 'shibuya', nameKey: 'travel.scene.shibuya', prompt: 'in Shibuya, Tokyo, busy street, city background, travel photography', group: 'international', x: 82, y: 40 },
  { id: 'eiffel', nameKey: 'travel.scene.eiffel', prompt: 'in front of the Eiffel Tower, Paris, travel photography, daytime', group: 'international', x: 49, y: 32 },
  { id: 'iceland', nameKey: 'travel.scene.iceland', prompt: 'in Iceland, dramatic mountains, waterfall, nature landscape, travel photography', group: 'international', x: 44, y: 18 },
  { id: 'santorini', nameKey: 'travel.scene.santorini', prompt: 'in Santorini, Greece, white and blue buildings, sea, sunny day, travel photography', group: 'international', x: 53, y: 38 },
  { id: 'nyc', nameKey: 'travel.scene.nyc', prompt: 'in New York City, Times Square, city street, travel photography', group: 'international', x: 28, y: 35 },
];

/** Taiwan round-island scenes - Expanded to 30 locations */
export const TRAVEL_SCENES_TAIWAN: TravelScene[] = [
  // --- North (Taipei, New Taipei, Keelung, Yilan) ---
  { id: 'taipei101', nameKey: 'travel.scene.taipei101', prompt: 'in front of Taipei 101, towering skyscraper background, Taipei city skyline', group: 'taiwan', x: 55, y: 18, referenceImagePath: '/images/scenes/taipei101.jpg' },
  { id: 'jiufen', nameKey: 'travel.scene.jiufen', prompt: 'at Jiufen Old Street, red lanterns, narrow alleyway, traditional tea house architecture', group: 'taiwan', x: 62, y: 14, referenceImagePath: '/images/scenes/jiufen.jpg' },
  { id: 'ximending', nameKey: 'travel.scene.ximending', prompt: 'in Ximending, neon signs, busy pedestrian street, vibrant urban atmosphere', group: 'taiwan', x: 48, y: 20, referenceImagePath: '/images/scenes/ximending.jpg' },
  { id: 'cks_memorial', nameKey: 'travel.scene.cks_memorial', prompt: 'at Chiang Kai-shek Memorial Hall, large white building with blue roof, spacious liberty square', group: 'taiwan', x: 52, y: 23, referenceImagePath: '/images/scenes/cks_memorial.jpg' },
  { id: 'raohe_market', nameKey: 'travel.scene.raohe_market', prompt: 'at Raohe Night Market entrance, glowing temple gate, busy street food stalls', group: 'taiwan', x: 58, y: 20, referenceImagePath: '/images/scenes/raohe_market.jpg' },
  { id: 'yehliu', nameKey: 'travel.scene.yehliu', prompt: 'at Yehliu Geopark, rock formations, Queens Head rock, ocean background', group: 'taiwan', x: 60, y: 10, referenceImagePath: '/images/scenes/yehliu.jpg' },
  { id: 'shifen_waterfall', nameKey: 'travel.scene.shifen', prompt: 'at Shifen Waterfall, large cascade of water, nature scenery, green lush forest', group: 'taiwan', x: 64, y: 17, referenceImagePath: '/images/scenes/shifen_waterfall.jpg' },
  { id: 'tamsui', nameKey: 'travel.scene.tamsui', prompt: 'at Tamsui Fishermans Wharf, Lovers Bridge, river sunset view, romantic atmosphere', group: 'taiwan', x: 46, y: 14, referenceImagePath: '/images/scenes/tamsui.jpg' },
  { id: 'guiishan', nameKey: 'travel.scene.guiishan', prompt: 'with Guishan Island (Turtle Island) in the background, ocean view, Yilan coast', group: 'taiwan', x: 68, y: 24, referenceImagePath: '/images/scenes/guiishan.jpg' },

  // --- Central (Taichung, Nantou, Changhua) ---
  { id: 'gaomei', nameKey: 'travel.scene.gaomei', prompt: 'at Gaomei Wetlands, wind turbines in background, mirror-like water reflection, sunset', group: 'taiwan', x: 36, y: 38, referenceImagePath: '/images/scenes/gaomei.jpg' },
  { id: 'taichung_theater', nameKey: 'travel.scene.theater', prompt: 'in front of National Taichung Theater, curved modern architecture, artistic building', group: 'taiwan', x: 42, y: 40, referenceImagePath: '/images/scenes/taichung_theater.jpg' },
  { id: 'rainbow_village', nameKey: 'travel.scene.rainbow', prompt: 'at Rainbow Village in Taichung, colorful painted walls, vibrant art patterns', group: 'taiwan', x: 40, y: 42, referenceImagePath: '/images/scenes/rainbow_village.jpg' },
  { id: 'sunmoonlake', nameKey: 'travel.scene.sunmoonlake', prompt: 'at Sun Moon Lake, calm blue water, layers of mountains, traditional boat dock', group: 'taiwan', x: 50, y: 48, referenceImagePath: '/images/scenes/sunmoonlake.jpg' },
  { id: 'qingjing', nameKey: 'travel.scene.qingjing', prompt: 'at Qingjing Farm, green rolling hills, sheep grazing, swiss-style architecture', group: 'taiwan', x: 54, y: 44, referenceImagePath: '/images/scenes/qingjing.jpg' },
  { id: 'hehuanshan', nameKey: 'travel.scene.hehuanshan', prompt: 'on Hehuanshan mountain peak, sea of clouds, high altitude alpine scenery', group: 'taiwan', x: 56, y: 40, referenceImagePath: '/images/scenes/hehuanshan.jpg' },
  { id: 'lugang', nameKey: 'travel.scene.lugang', prompt: 'in Lugang Old Street, red brick historic buildings, narrow lane, cultural heritage', group: 'taiwan', x: 34, y: 45, referenceImagePath: '/images/scenes/lugang.jpg' },

  // --- South (Yunlin, Chiayi, Tainan, Kaohsiung, Pingtung) ---
  { id: 'alishan', nameKey: 'travel.scene.alishan', prompt: 'in Alishan Forest, ancient giant cypress trees, misty railway track, forest train', group: 'taiwan', x: 45, y: 55, referenceImagePath: '/images/scenes/alishan.jpg' },
  { id: 'hinoki_village', nameKey: 'travel.scene.hinoki', prompt: 'at Hinoki Village Chiayi, japanese style wooden houses, zen garden atmosphere', group: 'taiwan', x: 42, y: 56, referenceImagePath: '/images/scenes/hinoki_village.jpg' },
  { id: 'tainan_confucius', nameKey: 'travel.scene.confucius', prompt: 'at Tainan Confucius Temple, traditional red walls, peaceful courtyard, ancient trees', group: 'taiwan', x: 40, y: 68, referenceImagePath: '/images/scenes/tainan_confucius.jpg' },
  { id: 'chimei_museum', nameKey: 'travel.scene.chimei', prompt: 'in front of Chimei Museum, grand european classical palace architecture, fountain', group: 'taiwan', x: 41, y: 70, referenceImagePath: '/images/scenes/chimei_museum.jpg' },
  { id: 'kaohsiung_music', nameKey: 'travel.scene.music_center', prompt: 'at Kaohsiung Music Center, futuristic honeycomb architecture, harbor view', group: 'taiwan', x: 40, y: 80, referenceImagePath: '/images/scenes/kaohsiung_music.jpg' },
  { id: 'dragon_tiger', nameKey: 'travel.scene.dragontiger', prompt: 'at Dragon and Tiger Pagodas Kaohsiung, twin pagodas, lotus lake, colorful bridge', group: 'taiwan', x: 41, y: 78, referenceImagePath: '/images/scenes/dragon_tiger.jpg' },
  { id: 'formosa_boulevard', nameKey: 'travel.scene.dome', prompt: 'inside Formosa Boulevard Station, Dome of Light, colorful stained glass ceiling', group: 'taiwan', x: 42, y: 81, referenceImagePath: '/images/scenes/formosa_boulevard.jpg' },
  { id: 'kenting', nameKey: 'travel.scene.kenting', prompt: 'at Kenting Baishawan beach, white sand, turquoise ocean, tropical palm trees', group: 'taiwan', x: 50, y: 88, referenceImagePath: '/images/scenes/kenting.jpg' },
  { id: 'eluanbi', nameKey: 'travel.scene.eluanbi', prompt: 'at Eluanbi Lighthouse, white lighthouse, green grass, blue sky, southern tip of Taiwan', group: 'taiwan', x: 52, y: 92, referenceImagePath: '/images/scenes/eluanbi.jpg' },

  // --- East (Hualien, Taitung) ---
  { id: 'taroko', nameKey: 'travel.scene.taroko', prompt: 'at Taroko Gorge, marble canyon walls, swallow grotto, turquoise river below', group: 'taiwan', x: 58, y: 35, referenceImagePath: '/images/scenes/taroko.jpg' },
  { id: 'qingshui_cliff', nameKey: 'travel.scene.qingshui', prompt: 'at Qingshui Cliff, steep cliffs dropping into the pacific ocean, dramatic coastline', group: 'taiwan', x: 60, y: 30, referenceImagePath: '/images/scenes/qingshui_cliff.jpg' },
  { id: 'mr_brown_ave', nameKey: 'travel.scene.mrbrown', prompt: 'at Mr. Brown Avenue Chishang, endless green rice paddies, road leading to mountains', group: 'taiwan', x: 55, y: 72, referenceImagePath: '/images/scenes/mr_brown_ave.jpg' },
  { id: 'sanxiantai', nameKey: 'travel.scene.sanxiantai', prompt: 'at Sanxiantai, eight-arch footbridge crossing the ocean, rocky coast', group: 'taiwan', x: 62, y: 65, referenceImagePath: '/images/scenes/sanxiantai.jpg' },

  // --- Islands ---
  { id: 'penghu', nameKey: 'travel.scene.penghu', prompt: 'in Penghu, traditional coral stone wall houses, blue sky, island vibe', group: 'taiwan', x: 20, y: 55, referenceImagePath: '/images/scenes/penghu.jpg' },
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
