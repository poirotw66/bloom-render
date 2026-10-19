/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Virtual try-on: generate image of person wearing provided clothing.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import { supportsMultiResolution, type ServiceSettings } from './shared';
import { generateTryOnPrompt } from './prompts/tryOn';

export interface GenerateTryOnOptions {
  settings?: ServiceSettings;
  variationIndex?: number;
  backgroundHint?: string;
  styleHint?: string;
  outputSize?: '1K' | '2K' | '4K';
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

/**
 * Generates one image of the person (first file) wearing the clothing (remaining files)
 * in a new fashion catalog-style scene.
 */
export const generateVirtualTryOn = async (
  personImage: File,
  clothingImages: File[],
  options: GenerateTryOnOptions = {},
): Promise<string> => {
  const serviceSettings = options.settings;

  const prompt = generateTryOnPrompt({
    clothingCount: clothingImages.length,
    variationIndex: options.variationIndex,
    backgroundHint: options.backgroundHint,
    styleHint: options.styleHint,
  });

  const images = [personImage, ...clothingImages];

  const model = serviceSettings?.model;
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveSize: '1K' | '2K' | '4K' = supportsMultiRes ? options.outputSize || '1K' : '1K';
  const aspectRatio = options.aspectRatio || '9:16';

  logger.debug('Starting virtual try-on generation', {
    clothingCount: clothingImages.length,
    outputSize: effectiveSize,
    aspectRatio,
  });

  return runImageGeneration({
    prompt,
    images,
    settings: serviceSettings,
    aspectRatio,
    imageSize: supportsMultiRes ? effectiveSize : undefined,
    includeImageConfig: true,
    context: 'try-on',
  });
};
