/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Filter: apply stylistic filter to entire image.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import type { ServiceSettings } from './shared';

/**
 * Generates an image with a filter applied using generative AI.
 */
export const generateFilteredImage = async (
  originalImage: File,
  filterPrompt: string,
  settings?: ServiceSettings,
): Promise<string> => {
  logger.debug(`Starting filter generation: ${filterPrompt}`);

  const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Asian').

Output: Return ONLY the final filtered image. Do not return text.`;

  return runImageGeneration({
    prompt,
    images: [originalImage],
    settings,
    includeImageConfig: false,
    context: 'filter',
  });
};
