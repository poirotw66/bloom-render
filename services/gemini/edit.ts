/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generative edit: localized edit based on prompt and hotspot.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import type { ServiceSettings } from './shared';

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 */
export const generateEditedImage = async (
  originalImage: File,
  userPrompt: string,
  hotspot: { x: number; y: number },
  settings?: ServiceSettings,
): Promise<string> => {
  logger.debug('Starting generative edit at:', hotspot);

  const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;

  return runImageGeneration({
    prompt,
    images: [originalImage],
    settings,
    includeImageConfig: false,
    context: 'edit',
  });
};
