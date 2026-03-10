/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ID Photo prompt generation.
 */

import type { RetouchLevel, IdPhotoType, OutputSpec, ClothingOption } from '../../../types';
import {
  buildPrompt,
  IDENTITY_PRESERVATION,
  QUALITY_REQUIREMENTS,
  buildNegativePrompt,
} from './base';
import { getVariation, ID_PHOTO_VARIATIONS, buildVariationNote } from './variations';

export interface IdPhotoPromptOptions {
  retouchLevel: { positiveModifier: string; negativeExtra: string };
  idType: { promptHint: string };
  outputSpec: { cropHint: string };
  clothingHint: string;
  clothingReferenceImage?: File;
  variationIndex?: number;
}

/**
 * Generate ID photo prompt
 */
export function generateIdPhotoPrompt(options: IdPhotoPromptOptions): string {
  const { retouchLevel, idType, outputSpec, clothingHint, clothingReferenceImage, variationIndex } =
    options;

  // Build positive requirements
  const positiveParts = [
    'Korean ID photo, passport-style photo',
    QUALITY_REQUIREMENTS.studio,
    IDENTITY_PRESERVATION.single,
    'neutral expression, mouth closed, eyes open, looking straight at camera',
    'clean pure white background, simple and clean background',
    QUALITY_REQUIREMENTS.photorealistic,
  ];

  // Add variation if generating multiple images
  let variationNote = '';
  if (variationIndex !== undefined) {
    const variationModifier = getVariation(ID_PHOTO_VARIATIONS, variationIndex);
    variationNote = buildVariationNote({ lighting: variationModifier });
  }

  // Build intro for two images if clothing reference exists
  const intro = clothingReferenceImage
    ? 'Note: You are given TWO images. The first image is the portrait to transform. The second image is a reference for the desired clothing/outfit.\n\n'
    : '';

  return buildPrompt({
    intro,
    role: 'You are an expert ID and passport photo retouching AI. Transform the provided portrait into a professional, compliant ID/passport-style photo.',
    requirements: [
      positiveParts.join(', '),
      outputSpec.cropHint,
      retouchLevel.positiveModifier,
      idType.promptHint,
      clothingHint,
      variationNote,
    ].filter(Boolean),
    negative:
      buildNegativePrompt([
        'identity',
        'filters',
        'aiArtifacts',
        'expressions',
        'lighting',
        'quality',
      ]) + (retouchLevel.negativeExtra ? `, ${retouchLevel.negativeExtra}` : ''),
    output: 'Output: Return ONLY the final ID/passport-style image. Do not return any text.',
  });
}
