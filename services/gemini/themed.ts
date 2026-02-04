/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Themed photoshoot generation.
 */

import { GenerateContentResponse } from '@google/genai';
import type { ThemedType } from '../../types';
import { THEMED_TYPES, DEFAULT_THEMED_TYPE } from '../../constants/themed';
import { fileToPart, getClient, getModel, handleApiResponse, type ServiceSettings } from './shared';

export interface GenerateThemedPhotoOptions {
  themeType?: ThemedType;
  settings?: ServiceSettings;
}

/**
 * Generates a themed photoshoot style from an original photo.
 */
export const generateThemedPhoto = async (
  originalImage: File,
  options: GenerateThemedPhotoOptions
): Promise<string> => {
  const themeType = options.themeType ?? DEFAULT_THEMED_TYPE;
  const serviceSettings = options.settings;

  const theme = THEMED_TYPES.find((t) => t.id === themeType) || THEMED_TYPES[0];

  const prompt = `You are a world-class themed portrait photographer and retouching AI.
Transform the provided image into a themed photoshoot style image.

Style Requirements:
${theme.promptHint}

Guidelines:
- Maintain strict identity consistency: any person in the image must look the same as in the original.
- Do NOT change facial structure or age of people.
- Apply the requested themed style (lighting, mood, aesthetic) while keeping the subject recognizable.
- Output should be photorealistic and high quality.

Output: Return ONLY the final themed image. Do not return any text.`;

  const textPart = { text: prompt };
  const originalImagePart = await fileToPart(originalImage);

  console.log('Starting themed photo generation', { themeType });
  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [originalImagePart, textPart] },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  console.log('Received response from model for themed photo.', response);
  return handleApiResponse(response, 'themed');
};
