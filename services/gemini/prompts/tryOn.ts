/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Virtual try-on prompt: fashion catalog style – aspirational, makes people want to buy.
 */

import { buildPrompt, IDENTITY_PRESERVATION, QUALITY_REQUIREMENTS } from './base';
import {
  getVariation,
  TRYON_POSE_VARIATIONS,
  TRYON_BACKGROUND_VARIATIONS,
  buildVariationNote,
} from './variations';

export interface TryOnPromptOptions {
  clothingCount: number;
  /** When generating multiple images, use this index for pose/background variation. */
  variationIndex?: number;
  /** User-selected background scene hint (e.g. studio, winter mountain). */
  backgroundHint?: string;
  /** User-selected style/mood hint (e.g. equestrian chic, sporty chic). */
  styleHint?: string;
}

/**
 * Generate virtual try-on prompt.
 * Output: high-end catalog style, very fashionable, aspirational, makes people want to buy.
 */
export function generateTryOnPrompt(options: TryOnPromptOptions): string {
  const { clothingCount, variationIndex, backgroundHint, styleHint } = options;

  let variationNote = '';
  if (variationIndex !== undefined) {
    const pose = getVariation(TRYON_POSE_VARIATIONS, variationIndex);
    const background = getVariation(TRYON_BACKGROUND_VARIATIONS, variationIndex);
    variationNote = buildVariationNote({
      composition: pose,
      detail: background,
    });
  }

  const backgroundLine = backgroundHint
    ? `Scene and background: ${backgroundHint}`
    : 'Create a NEW scene: use a clean, neutral background (e.g. studio wall, seamless backdrop, or soft gradient).';
  const styleLine = styleHint
    ? `Style and mood: ${styleHint}`
    : 'Present the overall outfit style clearly: full body or clear half-body framing. Natural pose that showcases the clothing, like a fashion catalog or lookbook.';

  return buildPrompt({
    role: "You are a top-tier fashion and catalog photography AI. Generate a NEW photograph that showcases the person from the first image wearing the clothing from the following image(s). The image must look like a high-end fashion catalog or magazine: very fashionable, aspirational, and desirable—the kind of image that makes people want to buy. Do NOT keep the person's original scene or background.",
    requirements: [
      'The FIRST image is the person (model). Preserve their face, body shape, skin tone, and identity exactly.',
      `The NEXT ${clothingCount} image(s) are clothing items. Dress the person in these garments so the full outfit is clearly visible, well-fitted, and looks natural. If multiple items are provided (e.g. top + bottom), combine them into one coherent, stylish outfit.`,
      backgroundLine,
      styleLine,
      `${QUALITY_REQUIREMENTS.photorealistic} ${QUALITY_REQUIREMENTS.highQuality}. Professional fashion photography, catalog / lookbook style. Lighting must be flattering and highlight the clothing. The result should feel luxurious and covetable.`,
      variationNote,
    ].filter(Boolean),
    guidelines: [
      IDENTITY_PRESERVATION.single,
      "Do not change the person's face, age, or body type.",
      'Lighting and shadows must be consistent and natural on both person and clothing.',
      'Output a single image only; no text, no multiple images.',
    ],
    output:
      'Output: Return ONLY the final fashion catalog-style image (person wearing the outfit in a new, aspirational scene). Do not return any text or multiple images.',
  });
}
