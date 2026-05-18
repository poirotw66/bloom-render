/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Global adjustment: apply natural adjustment across entire image.
 */

import { GenerateContentResponse } from '@google/genai';
import { logger } from '../../utils/logger';
import {
  fileToPartAuto,
  getClient,
  getModel,
  handleApiResponse,
  type ServiceSettings,
} from './shared';

/**
 * Generates an image with a global adjustment applied using generative AI.
 */
export const generateAdjustedImage = async (
  originalImage: File,
  adjustmentPrompt: string,
  settings?: ServiceSettings,
): Promise<string> => {
  logger.debug(`Starting global adjustment generation: ${adjustmentPrompt}`);
  const ai = getClient(settings);
  const model = getModel(settings);

  const originalImagePart = await fileToPartAuto(originalImage);
  const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
  const textPart = { text: prompt };

  logger.debug(`Sending image and adjustment prompt to the model (${model})...`);
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: { parts: [originalImagePart, textPart] },
  });
  logger.debug('Received response from model for adjustment', response);

  return handleApiResponse(response, 'adjustment');
};
