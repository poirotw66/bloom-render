/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Filter: apply stylistic filter to entire image.
 */

import { GenerateContentResponse } from '@google/genai';
import { fileToPartAuto, getClient, getModel, handleApiResponse, type ServiceSettings } from './shared';

/**
 * Generates an image with a filter applied using generative AI.
 */
export const generateFilteredImage = async (
  originalImage: File,
  filterPrompt: string,
  settings?: ServiceSettings
): Promise<string> => {
  console.log(`Starting filter generation: ${filterPrompt}`);
  const ai = getClient(settings);
  const model = getModel(settings);

  const originalImagePart = await fileToPartAuto(originalImage);
  const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Asian').

Output: Return ONLY the final filtered image. Do not return text.`;
  const textPart = { text: prompt };

  console.log(`Sending image and filter prompt to the model (${model})...`);
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: { parts: [originalImagePart, textPart] },
  });
  console.log('Received response from model for filter.', response);

  return handleApiResponse(response, 'filter');
};
