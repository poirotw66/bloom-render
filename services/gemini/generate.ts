/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Text-to-image generation.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import { supportsMultiResolution, type ServiceSettings } from './shared';

/** Builds the text prompt; appends reference guidance when an image is attached. */
export function buildGeneratePrompt(userPrompt: string, hasReferenceImage: boolean): string {
  if (!hasReferenceImage) return userPrompt;
  return (
    `${userPrompt}\n\n` +
    'A reference image is attached. Use it as visual inspiration for style, lighting, ' +
    'composition, color palette, and atmosphere. Do NOT copy the reference exactly — ' +
    'create a new image guided by the text description above while drawing from the ' +
    "reference's visual qualities."
  );
}

/**
 * Generates one or more images from scratch based on a text prompt.
 * Optionally uses a reference image for style / atmosphere inspiration.
 */
export const generateImageFromText = async (
  prompt: string,
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' = '1:1',
  numberOfImages: number = 1,
  settings?: ServiceSettings,
  referenceImage?: File | null,
): Promise<string[]> => {
  const hasReference = !!referenceImage;
  logger.debug(
    `Starting text-to-image generation: ${prompt}, Aspect Ratio: ${aspectRatio}, Count: ${numberOfImages}` +
      (hasReference ? ' (with reference image)' : ''),
  );

  const textPrompt = buildGeneratePrompt(prompt, hasReference);
  const model = settings?.model;
  const imageSize = supportsMultiResolution(model) ? ('1K' as const) : undefined;
  const images = referenceImage ? [referenceImage] : [];

  const promises = Array.from({ length: numberOfImages }).map(async () =>
    runImageGeneration({
      prompt: textPrompt,
      images,
      settings,
      aspectRatio,
      imageSize,
      includeImageConfig: true,
      context: 'generation',
    }),
  );

  const results = await Promise.all(promises);
  logger.debug(`Generated ${results.length} images.`);
  return results;
};
