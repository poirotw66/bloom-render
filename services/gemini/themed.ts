/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Themed photoshoot generation.
 */

import { logger } from '../../utils/logger';
import type { ThemedType } from '../../types';
import { THEMED_TYPES, DEFAULT_THEMED_TYPE } from '../../constants/themed';
import { runImageGeneration } from './runImageGeneration';
import { supportsMultiResolution, type ServiceSettings } from './shared';
import { generateThemedPrompt } from './prompts';

export type ImageOutputSize = '1K' | '2K' | '4K';
export type ImageAspectRatio = '1:1' | '16:9' | '9:16';

export interface GenerateThemedPhotoOptions {
  themeType?: ThemedType;
  settings?: ServiceSettings;
  variationIndex?: number;
  outputSize?: ImageOutputSize;
  aspectRatio?: ImageAspectRatio;
}

/**
 * Generates a themed photoshoot style from an original photo or photos.
 * Supports single person, couple (2 files), or group (3+ files).
 */
export const generateThemedPhoto = async (
  originalImage: File | File[],
  options: GenerateThemedPhotoOptions,
): Promise<string> => {
  const themeType = options.themeType ?? DEFAULT_THEMED_TYPE;
  const serviceSettings = options.settings;

  const isGroup = Array.isArray(originalImage);
  const fileCount = isGroup ? originalImage.length : 1;
  const images = isGroup ? originalImage : [originalImage];

  const theme = THEMED_TYPES.find((t) => t.id === themeType) || THEMED_TYPES[0];

  const prompt = generateThemedPrompt({
    themeType: theme,
    fileCount,
    variationIndex: options.variationIndex,
  });

  const model = serviceSettings?.model;
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveSize: '1K' | '2K' | '4K' = supportsMultiRes ? options.outputSize || '1K' : '1K';
  const aspectRatio = options.aspectRatio || '16:9';

  logger.debug('Starting themed photo generation', {
    themeType,
    fileCount,
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
    context: 'themed',
  });
};
