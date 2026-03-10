/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Couple/Group photo prompt generation.
 */

import { buildPrompt, IDENTITY_PRESERVATION } from './base';
import {
  getVariation,
  COUPLE_GROUP_LIGHTING_VARIATIONS,
  COUPLE_GROUP_COMPOSITION_VARIATIONS,
  COUPLE_GROUP_EXPRESSION_VARIATIONS,
  buildVariationNote,
} from './variations';

export interface CoupleGroupPromptOptions {
  styleHint: string;
  fileCount: number;
  mode: 'couple' | 'group';
  variationIndex?: number;
}

/**
 * Generate couple/group photo prompt
 */
export function generateCoupleGroupPrompt(options: CoupleGroupPromptOptions): string {
  const { styleHint, fileCount, mode, variationIndex } = options;

  const isGroup = fileCount > 1;

  // Build variation note if generating multiple images
  let variationNote = '';
  if (variationIndex !== undefined) {
    const lightingVar = getVariation(COUPLE_GROUP_LIGHTING_VARIATIONS, variationIndex);
    const compositionVar = getVariation(COUPLE_GROUP_COMPOSITION_VARIATIONS, variationIndex);
    const expressionVar = getVariation(COUPLE_GROUP_EXPRESSION_VARIATIONS, variationIndex);
    variationNote = buildVariationNote({
      lighting: lightingVar,
      composition: compositionVar,
      expression: expressionVar,
    });
  }

  const identityConsistency = fileCount === 2 ? 'both people' : `all ${fileCount} people`;

  const groupDescription = fileCount === 2 ? 'couple' : `group of ${fileCount} people`;

  const arrangementDescription = fileCount === 2 ? 'the couple' : 'the group';

  return buildPrompt({
    role: `You are a world-class ${mode === 'couple' ? 'couple' : 'group'} portrait photographer and retouching AI. Transform the provided ${groupDescription} portrait${isGroup ? 's' : ''} into a high-end, professional style image.`,
    requirements: [`${styleHint}${variationNote}`],
    guidelines: [
      `Maintain strict identity consistency: ${identityConsistency} must look the same as in the ${isGroup ? 'source images' : 'original image'}.`,
      'Do NOT change facial structure or age.',
      `Arrange ${arrangementDescription} naturally and harmoniously in the composition.`,
      'Only enhance lighting, skin texture, and apply the requested photography style.',
      'Output should be photorealistic and high quality.',
    ],
    output: `Output: Return ONLY the final ${mode === 'couple' ? 'couple' : 'group'} portrait image. Do not return any text.`,
  });
}
