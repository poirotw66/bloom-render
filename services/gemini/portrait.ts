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
 * Generates a professional portrait style from an original photo.
 */
export const generateProfessionalPortrait = async (
  originalImage: File,
  options: GeneratePortraitOptions
): Promise<string> => {
  const portraitType = options.portraitType ?? DEFAULT_PORTRAIT_TYPE;
  const outputSpec = options.outputSpec ?? DEFAULT_PORTRAIT_SPEC;
  const serviceSettings = options.settings;

  const style = PORTRAIT_TYPES.find((t) => t.id === portraitType) || PORTRAIT_TYPES[0];
  const spec =
    PORTRAIT_OUTPUT_SPECS.find((s) => s.id === outputSpec) || PORTRAIT_OUTPUT_SPECS[0];

  const positive = [
    'Professional photography portrait',
    'High-end studio retouching',
    'Preserve identity and facial features of the person in the source image',
    style.promptHint,
    spec.cropHint,
    'Clean professional background suitable for the style',
    'Perfect studio lighting',
    'Realistic, photorealistic, premium quality',
  ]
    .filter(Boolean)
    .join('. ');

  const prompt = `You are a world-class professional portrait photographer and retouching AI. 
Transform the provided portrait into a high-end, professional style image.

Style Requirements:
${positive}

Guidelines:
- Maintain strict identity consistency: the person must be the same as in the original image.
- Do NOT change facial structure or age.
- Only enhance lighting, skin texture, and apply the requested professional photography style.

Output: Return ONLY the final professional portrait image. Do not return any text.`;

  const textPart = { text: prompt };
  const originalImagePart = await fileToPart(originalImage);

  console.log('Starting portrait generation', { portraitType, outputSpec });
  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [originalImagePart, textPart] },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  console.log('Received response from model for professional portrait.', response);
  return handleApiResponse(response, 'portrait');
};
