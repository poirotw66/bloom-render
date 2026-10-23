/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Selection helpers for multi-style collage (toggle / limits).
 */

import { STYLE_COLLAGE_MAX, STYLE_COLLAGE_MIN } from './styleCollageLayout';

export type ViralSelectionToggleResult = {
  ids: string[];
  /** True when the toggle was rejected because the max was already reached. */
  rejectedAtMax: boolean;
};

/** Toggle `id` in an ordered selection list, respecting min/max for collage. */
export function toggleViralSelection(
  current: readonly string[],
  id: string,
  options?: { max?: number },
): ViralSelectionToggleResult {
  const max = options?.max ?? STYLE_COLLAGE_MAX;
  const idx = current.indexOf(id);
  if (idx >= 0) {
    return { ids: current.filter((x) => x !== id), rejectedAtMax: false };
  }
  if (current.length >= max) {
    return { ids: [...current], rejectedAtMax: true };
  }
  return { ids: [...current, id], rejectedAtMax: false };
}

export function canStartStyleCollage(selectedCount: number): boolean {
  return selectedCount >= STYLE_COLLAGE_MIN && selectedCount <= STYLE_COLLAGE_MAX;
}

export { STYLE_COLLAGE_MAX, STYLE_COLLAGE_MIN };
