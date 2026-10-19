/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Professional portrait (corporate /形象照) generation.
 */

import { logger } from '../../utils/logger';
import type { PortraitType, OutputSpec } from '../../types';
import {
  PORTRAIT_TYPES,
  PORTRAIT_OUTPUT_SPECS,
  DEFAULT_PORTRAIT_TYPE,
  DEFAULT_PORTRAIT_SPEC,
} from '../../constants/portrait';
import { runImageGeneration } from './runImageGeneration';
import { supportsMultiResolution, type ServiceSettings } from './shared';
import { generatePortraitPrompt } from './prompts';

export interface GeneratePortraitOptions {
  portraitType?: PortraitType;
  outputSpec?: OutputSpec;
  imageSize?: '1K' | '2K' | '4K';
  settings?: ServiceSettings;
  variationIndex?: number;
}

/**
 * Generates a professional portrait style from an original photo or photos.
 * Supports single person, couple (2 files), or group (3+ files).
 */
export const generateProfessionalPortrait = async (
  originalImage: File | File[],
  options: GeneratePortraitOptions,
): Promise<string> => {
  const portraitType = options.portraitType ?? DEFAULT_PORTRAIT_TYPE;
  const outputSpec = options.outputSpec ?? DEFAULT_PORTRAIT_SPEC;
  const serviceSettings = options.settings;
  const requestedImageSize = options.imageSize;

  const isGroup = Array.isArray(originalImage);
  const fileCount = isGroup ? originalImage.length : 1;
  const images = isGroup ? originalImage : [originalImage];

  const style = PORTRAIT_TYPES.find((t) => t.id === portraitType) || PORTRAIT_TYPES[0];
  const spec = PORTRAIT_OUTPUT_SPECS.find((s) => s.id === outputSpec) || PORTRAIT_OUTPUT_SPECS[0];

  const prompt = generatePortraitPrompt({
    portraitType: style,
    outputSpec: spec,
    fileCount,
    variationIndex: options.variationIndex,
  });

  const model = serviceSettings?.model;
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveImageSize: '1K' | '2K' | '4K' = supportsMultiRes
    ? requestedImageSize || '1K'
    : '1K';

  logger.debug('Starting portrait generation', {
    portraitType,
    outputSpec,
    fileCount,
    imageSize: effectiveImageSize,
  });

  return runImageGeneration({
    prompt,
    images,
    settings: serviceSettings,
    imageSize: supportsMultiRes ? effectiveImageSize : undefined,
    includeImageConfig: true,
    context: 'portrait',
  });
};
