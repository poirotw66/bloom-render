/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lazy-loaded travel scene catalog (split from constants/travel.ts for smaller Travel route chunk).
 */

import type { TravelScene } from '../types';

export interface TravelSceneCatalog {
  international: TravelScene[];
  taiwan: TravelScene[];
  all: TravelScene[];
}

let catalogPromise: Promise<TravelSceneCatalog> | null = null;
let catalogCache: TravelSceneCatalog | null = null;

export function loadTravelSceneCatalog(): Promise<TravelSceneCatalog> {
  if (catalogCache) {
    return Promise.resolve(catalogCache);
  }
  if (!catalogPromise) {
    catalogPromise = Promise.all([
      import('./travel-data/scenes-international.json'),
      import('./travel-data/scenes-taiwan.json'),
    ]).then(([intlMod, twMod]) => {
      const international = intlMod.default as TravelScene[];
      const taiwan = twMod.default as TravelScene[];
      catalogCache = {
        international,
        taiwan,
        all: [...international, ...taiwan],
      };
      return catalogCache;
    });
  }
  return catalogPromise;
}

/** For tests or forced reload; not used in production UI. */
export function resetTravelSceneCatalogCache(): void {
  catalogPromise = null;
  catalogCache = null;
}

export function pickRandomTravelScene(scenes: TravelScene[]): TravelScene {
  const i = Math.floor(Math.random() * scenes.length);
  return scenes[i];
}
