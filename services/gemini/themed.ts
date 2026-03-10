/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Themed photoshoot generation.
 */

import { GenerateContentResponse } from '@google/genai';
import type { ThemedType } from '../../types';
import { THEMED_TYPES, DEFAULT_THEMED_TYPE } from '../../constants/themed';
import {
  fileToPartAuto,
  getClient,
  getModel,
  handleApiResponse,
  supportsMultiResolution,
  type ServiceSettings,
} from './shared';
import { generateThemedPrompt } from './prompts';

export type ImageOutputSize = '1K' | '2K' | '4K';
export type ImageAspectRatio = '1:1' | '16:9' | '9:16';

export interface GenerateThemedPhotoOptions {
  themeType?: ThemedType;
  settings?: ServiceSettings;
  variationIndex?: number; // For generating different variations
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

  const theme = THEMED_TYPES.find((t) => t.id === themeType) || THEMED_TYPES[0];

  // Generate prompt using unified prompt system
  const prompt = generateThemedPrompt({
    themeType: theme,
    fileCount,
    variationIndex: options.variationIndex,
  });

  const textPart = { text: prompt };
  const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [];

  if (isGroup) {
    for (const file of originalImage) {
      parts.push(await fileToPartAuto(file));
    }
  } else {
    parts.push(await fileToPartAuto(originalImage));
  }
  parts.push(textPart);

  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveSize: '1K' | '2K' | '4K' = supportsMultiRes ? options.outputSize || '1K' : '1K';
  const aspectRatio = options.aspectRatio || '16:9';

  const imageConfig: { aspectRatio: string; imageSize?: '1K' | '2K' | '4K' } = {
    aspectRatio,
  };
  if (supportsMultiRes) imageConfig.imageSize = effectiveSize;

  console.log('Starting themed photo generation', {
    themeType,
    fileCount,
    outputSize: effectiveSize,
    aspectRatio,
  });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig,
    },
  });

  console.log('Received response from model for themed photo.', response);
  return handleApiResponse(response, 'themed');
};
