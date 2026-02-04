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
 * Generates a themed photoshoot style from an original photo or photos.
 * Supports single person, couple (2 files), or group (3+ files).
 */
export const generateThemedPhoto = async (
  originalImage: File | File[],
  options: GenerateThemedPhotoOptions
): Promise<string> => {
  const themeType = options.themeType ?? DEFAULT_THEMED_TYPE;
  const serviceSettings = options.settings;

  const isGroup = Array.isArray(originalImage);
  const fileCount = isGroup ? originalImage.length : 1;

  const theme = THEMED_TYPES.find((t) => t.id === themeType) || THEMED_TYPES[0];

  const introMultiImages = isGroup
    ? `Note: You are given ${fileCount} portrait images. Create a ${fileCount === 2 ? 'couple' : 'group'} themed photoshoot featuring all of them.\n\n`
    : '';

  const prompt = `${introMultiImages}You are a world-class themed portrait photographer and retouching AI.
Transform the provided image${isGroup ? 's' : ''} into a themed photoshoot style image.

Style Requirements:
${theme.promptHint}

Guidelines:
- Maintain strict identity consistency: ${fileCount === 1 ? 'the person' : fileCount === 2 ? 'both people' : 'all people'} must look the same as in the ${isGroup ? 'source images' : 'original image'}.
- Do NOT change facial structure or age of people.
- Apply the requested themed style (lighting, mood, aesthetic) while keeping ${fileCount === 1 ? 'the subject' : fileCount === 2 ? 'both subjects' : 'all subjects'} recognizable.
- Output should be photorealistic and high quality.
${fileCount > 1 ? `- Arrange ${fileCount === 2 ? 'the couple' : 'the group'} naturally and harmoniously in the themed composition.` : ''}

Output: Return ONLY the final themed image. Do not return any text.`;

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

  console.log('Starting themed photo generation', { themeType, fileCount });
  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  console.log('Received response from model for themed photo.', response);
  return handleApiResponse(response, 'themed');
};
