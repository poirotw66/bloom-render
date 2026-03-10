/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Professional portrait prompt generation.
 */

import type { PortraitType, OutputSpec } from '../../../types';
import { buildPrompt, IDENTITY_PRESERVATION, QUALITY_REQUIREMENTS } from './base';
import {
  getVariation,
  LIGHTING_VARIATIONS,
  ANGLE_VARIATIONS,
  EXPRESSION_VARIATIONS,
  buildVariationNote,
} from './variations';

export interface PortraitPromptOptions {
  portraitType: { promptHint: string };
  outputSpec: { cropHint: string };
  fileCount: number;
  variationIndex?: number;
}

/**
 * Generate professional portrait prompt
 */
export function generatePortraitPrompt(options: PortraitPromptOptions): string {
  const { portraitType, outputSpec, fileCount, variationIndex } = options;

  const isGroup = fileCount > 1;
  const peopleDescription =
    fileCount === 1
      ? 'the person in the source image'
      : fileCount === 2
        ? 'the couple (two people) in the source images'
        : `the group (${fileCount} people) in the source images`;

  // Build positive requirements
  const portraitTypeLabel =
    fileCount === 1
      ? 'Professional photography portrait'
      : fileCount === 2
        ? 'Professional couple photography portrait'
        : `Professional group photography portrait with ${fileCount} people`;

  const positiveParts = [
    portraitTypeLabel,
    'High-end studio retouching',
    `Preserve identity and facial features of ${peopleDescription}`,
    portraitType.promptHint,
    outputSpec.cropHint,
    'Clean professional background suitable for the style',
  ];

  // Add variation if generating multiple images
  let lightingVar = 'Perfect studio lighting';
  let angleVar = '';
  let expressionVar = '';
  let variationNote = '';

  if (variationIndex !== undefined) {
    lightingVar = getVariation(LIGHTING_VARIATIONS, variationIndex);
    angleVar = getVariation(ANGLE_VARIATIONS, variationIndex);
    expressionVar = getVariation(EXPRESSION_VARIATIONS, variationIndex);
    variationNote = buildVariationNote({
      lighting: lightingVar,
      angle: angleVar,
      expression: expressionVar,
    });
  }

  positiveParts.push(
    `${lightingVar}${angleVar ? `, ${angleVar}` : ''}${expressionVar ? `, ${expressionVar}` : ''}`,
  );
  positiveParts.push('Realistic, photorealistic, premium quality');

  // Build intro for multiple images
  const intro = isGroup
    ? `Note: You are given ${fileCount} portrait images. Create a ${fileCount === 2 ? 'couple' : 'group'} portrait featuring all of them.\n\n`
    : '';

  const identityConsistency =
    fileCount === 1 ? 'the person' : fileCount === 2 ? 'both people' : 'all people';

  return buildPrompt({
    intro,
    role: `You are a world-class professional portrait photographer and retouching AI. Transform the provided portrait${isGroup ? 's' : ''} into a high-end, professional style image.`,
    requirements: [positiveParts.join('. ')],
    guidelines: [
      `Maintain strict identity consistency: ${identityConsistency} must be the same as in the ${isGroup ? 'source images' : 'original image'}.`,
      'Do NOT change facial structure or age.',
      'Only enhance lighting, skin texture, and apply the requested professional photography style.',
      ...(fileCount > 1
        ? [
            `Arrange ${fileCount === 2 ? 'the couple' : 'the group'} naturally and harmoniously in the composition.`,
          ]
        : []),
    ],
    output: 'Output: Return ONLY the final professional portrait image. Do not return any text.',
  });
}
