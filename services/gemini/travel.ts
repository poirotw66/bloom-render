/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Travel photo generation: same person in selected scene.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import { supportsMultiResolution, type ServiceSettings } from './shared';
import { generateTravelPrompt } from './prompts';

export interface GenerateTravelPhotoOptions {
  scenePrompt: string;
  sceneReferenceImage?: File;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  imageSize?: '1K' | '2K' | '4K';
  settings?: ServiceSettings;
  variationIndex?: number;
}

/**
 * Generates a travel photo: the same person in a selected scene.
 */
export const generateTravelPhoto = async (
  originalImage: File | File[],
  options: GenerateTravelPhotoOptions,
): Promise<string> => {
  const {
    scenePrompt,
    sceneReferenceImage,
    aspectRatio = '1:1',
    imageSize: requestedSize,
    settings: serviceSettings,
  } = options;

  const isGroup = Array.isArray(originalImage);
  const images = isGroup ? [...originalImage] : [originalImage];
  if (sceneReferenceImage) images.push(sceneReferenceImage);

  const prompt = generateTravelPrompt({
    scenePrompt,
    sceneReferenceImage,
    aspectRatio,
    isGroup,
    variationIndex: options.variationIndex,
  });

  const model = serviceSettings?.model;
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveImageSize: '1K' | '2K' | '4K' = supportsMultiRes ? requestedSize || '1K' : '1K';

  logger.debug('Starting travel photo generation', {
    scenePrompt: scenePrompt.slice(0, 60),
    isGroup,
    hasSceneRef: !!sceneReferenceImage,
    aspectRatio,
    imageSize: effectiveImageSize,
  });

  return runImageGeneration({
    prompt,
    images,
    settings: serviceSettings,
    aspectRatio: aspectRatio || '1:1',
    imageSize: supportsMultiRes ? effectiveImageSize : undefined,
    includeImageConfig: true,
    context: 'travel',
  });
};
