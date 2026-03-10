/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Themed photoshoot prompt generation.
 */

import type { ThemedType } from '../../../types';
import { buildPrompt, IDENTITY_PRESERVATION } from './base';
import {
  getVariation,
  COMPOSITION_VARIATIONS,
  DETAIL_VARIATIONS,
  buildVariationNote,
} from './variations';

export interface ThemedPromptOptions {
  themeType: { promptHint: string };
  fileCount: number;
  variationIndex?: number;
}

/**
 * Generate themed photoshoot prompt
 */
export function generateThemedPrompt(options: ThemedPromptOptions): string {
  const { themeType, fileCount, variationIndex } = options;

  const isGroup = fileCount > 1;

  // Build variation note if generating multiple images
  let variationNote = '';
  if (variationIndex !== undefined) {
    const compositionVar = getVariation(COMPOSITION_VARIATIONS, variationIndex);
    const detailVar = getVariation(DETAIL_VARIATIONS, variationIndex);
    variationNote = buildVariationNote({
      composition: compositionVar,
      detail: detailVar,
    });
  }

  // Build intro for multiple images
  const intro = isGroup
    ? `Note: You are given ${fileCount} portrait images. Create a ${fileCount === 2 ? 'couple' : 'group'} themed photoshoot featuring all of them.\n\n`
    : '';

  const identityConsistency =
    fileCount === 1 ? 'the person' : fileCount === 2 ? 'both people' : 'all people';

  const subjectDescription =
    fileCount === 1 ? 'the subject' : fileCount === 2 ? 'both subjects' : 'all subjects';

  return buildPrompt({
    intro,
    role: `You are a world-class themed portrait photographer and retouching AI. Transform the provided image${isGroup ? 's' : ''} into a themed photoshoot style image.`,
    requirements: [`${themeType.promptHint}${variationNote}`],
    guidelines: [
      `Maintain strict identity consistency: ${identityConsistency} must look the same as in the ${isGroup ? 'source images' : 'original image'}.`,
      'Do NOT change facial structure or age of people.',
      `Apply the requested themed style (lighting, mood, aesthetic) while keeping ${subjectDescription} recognizable.`,
      'Output should be photorealistic and high quality.',
      ...(fileCount > 1
        ? [
            `Arrange ${fileCount === 2 ? 'the couple' : 'the group'} naturally and harmoniously in the themed composition.`,
          ]
        : []),
    ],
    output: 'Output: Return ONLY the final themed image. Do not return any text.',
  });
}
