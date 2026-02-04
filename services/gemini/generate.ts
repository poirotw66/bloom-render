/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Text-to-image generation.
 */

import { GenerateContentResponse } from '@google/genai';
import { getClient, getModel, handleApiResponse, type ServiceSettings } from './shared';

/**
 * Generates one or more images from scratch based on a text prompt.
 */
export const generateImageFromText = async (
  prompt: string,
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' = '1:1',
  numberOfImages: number = 1,
  settings?: ServiceSettings
): Promise<string[]> => {
  console.log(
    `Starting text-to-image generation: ${prompt}, Aspect Ratio: ${aspectRatio}, Count: ${numberOfImages}`
  );
  const ai = getClient(settings);
  const model = getModel(settings);

  const promises = Array.from({ length: numberOfImages }).map(async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          ...(model === 'gemini-3-pro-image-preview' ? { imageSize: '1K' as const } : {}),
        },
      },
    });
    return handleApiResponse(response, 'generation');
  });

  const results = await Promise.all(promises);
  console.log(`Generated ${results.length} images.`);

  return results;
};
