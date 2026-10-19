/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Global adjustment: apply natural adjustment across entire image.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import type { ServiceSettings } from './shared';

/**
 * Generates an image with a global adjustment applied using generative AI.
 */
export const generateAdjustedImage = async (
  originalImage: File,
  adjustmentPrompt: string,
  settings?: ServiceSettings,
): Promise<string> => {
  logger.debug(`Starting global adjustment generation: ${adjustmentPrompt}`);

  const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;

  return runImageGeneration({
    prompt,
    images: [originalImage],
    settings,
    includeImageConfig: false,
    context: 'adjustment',
  });
};
