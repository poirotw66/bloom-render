/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Types for AI virtual try-on feature.
 */

/** Max number of clothing images allowed. */
export const MAX_CLOTHING_IMAGES = 5;

/** Min number of clothing images required. */
export const MIN_CLOTHING_IMAGES = 1;

/** Output size for try-on (Gemini 3: 1K/2K/4K; Gemini 2: 1K only). */
export type TryOnOutputSize = '1K' | '2K' | '4K';

/** Aspect ratio for try-on output. */
export type TryOnAspectRatio = '1:1' | '16:9' | '9:16';

export const TRYON_OUTPUT_SIZES: TryOnOutputSize[] = ['1K', '2K', '4K'];
export const TRYON_ASPECT_RATIOS: TryOnAspectRatio[] = ['1:1', '16:9', '9:16'];
export const DEFAULT_TRYON_OUTPUT_SIZE: TryOnOutputSize = '1K';
export const DEFAULT_TRYON_ASPECT_RATIO: TryOnAspectRatio = '9:16';
