/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Professional portrait (corporate /形象照) generation.
 */

import { GenerateContentResponse } from '@google/genai';
import type { PortraitType, OutputSpec } from '../../types';
import {
  PORTRAIT_TYPES,
  PORTRAIT_OUTPUT_SPECS,
  DEFAULT_PORTRAIT_TYPE,
  DEFAULT_PORTRAIT_SPEC,
} from '../../constants/portrait';
import { fileToPart, getClient, getModel, handleApiResponse, type ServiceSettings } from './shared';

export interface GeneratePortraitOptions {
  portraitType?: PortraitType;
  outputSpec?: OutputSpec;
  settings?: ServiceSettings;
}

/**
 * Generates a professional portrait style from an original photo or photos.
 * Supports single person, couple (2 files), or group (3+ files).
 */
export const generateProfessionalPortrait = async (
  originalImage: File | File[],
  options: GeneratePortraitOptions
): Promise<string> => {
  const portraitType = options.portraitType ?? DEFAULT_PORTRAIT_TYPE;
  const outputSpec = options.outputSpec ?? DEFAULT_PORTRAIT_SPEC;
  const serviceSettings = options.settings;

  const isGroup = Array.isArray(originalImage);
  const fileCount = isGroup ? originalImage.length : 1;

  const style = PORTRAIT_TYPES.find((t) => t.id === portraitType) || PORTRAIT_TYPES[0];
  const spec =
    PORTRAIT_OUTPUT_SPECS.find((s) => s.id === outputSpec) || PORTRAIT_OUTPUT_SPECS[0];

  // Adjust prompt based on number of people
  let peopleDescription: string;
  if (fileCount === 1) {
    peopleDescription = 'the person in the source image';
  } else if (fileCount === 2) {
    peopleDescription = 'the couple (two people) in the source images';
  } else {
    peopleDescription = `the group (${fileCount} people) in the source images`;
  }

  const positive = [
    fileCount === 1
      ? 'Professional photography portrait'
      : fileCount === 2
        ? 'Professional couple photography portrait'
        : `Professional group photography portrait with ${fileCount} people`,
    'High-end studio retouching',
    `Preserve identity and facial features of ${peopleDescription}`,
    style.promptHint,
    spec.cropHint,
    'Clean professional background suitable for the style',
    'Perfect studio lighting',
    'Realistic, photorealistic, premium quality',
  ]
    .filter(Boolean)
    .join('. ');

  const introMultiImages = isGroup
    ? `Note: You are given ${fileCount} portrait images. Create a ${fileCount === 2 ? 'couple' : 'group'} portrait featuring all of them.\n\n`
    : '';

  const prompt = `${introMultiImages}You are a world-class professional portrait photographer and retouching AI. 
Transform the provided portrait${isGroup ? 's' : ''} into a high-end, professional style image.

Style Requirements:
${positive}

Guidelines:
- Maintain strict identity consistency: ${fileCount === 1 ? 'the person' : fileCount === 2 ? 'both people' : 'all people'} must be the same as in the ${isGroup ? 'source images' : 'original image'}.
- Do NOT change facial structure or age.
- Only enhance lighting, skin texture, and apply the requested professional photography style.
${fileCount > 1 ? `- Arrange ${fileCount === 2 ? 'the couple' : 'the group'} naturally and harmoniously in the composition.` : ''}

Output: Return ONLY the final professional portrait image. Do not return any text.`;

  const textPart = { text: prompt };
  const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [];

  if (isGroup) {
    for (const file of originalImage) {
      parts.push(await fileToPart(file));
    }
  } else {
    parts.push(await fileToPart(originalImage));
  }
  parts.push(textPart);

  console.log('Starting portrait generation', { portraitType, outputSpec, fileCount });
  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  console.log('Received response from model for professional portrait.', response);
  return handleApiResponse(response, 'portrait');
};
