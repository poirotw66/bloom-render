/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel photo generation: same person in selected scene.
 */

import { GenerateContentResponse } from '@google/genai';
import {
  fileToPartAuto,
  getClient,
  getModel,
  handleApiResponse,
  supportsMultiResolution,
  type ServiceSettings,
} from './shared';
import { generateTravelPrompt } from './prompts';

export interface GenerateTravelPhotoOptions {
  scenePrompt: string;
  sceneReferenceImage?: File;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  imageSize?: '1K' | '2K' | '4K';
  settings?: ServiceSettings;
  variationIndex?: number; // For generating different variations
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

  // Generate prompt using unified prompt system
  const prompt = generateTravelPrompt({
    scenePrompt,
    sceneReferenceImage,
    aspectRatio,
    isGroup,
    variationIndex: options.variationIndex,
  });
  const textPart = { text: prompt };

  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveImageSize: '1K' | '2K' | '4K' = supportsMultiRes ? requestedSize || '1K' : '1K';

  const imageConfig: { aspectRatio: string; imageSize?: '1K' | '2K' | '4K' } = {
    aspectRatio: aspectRatio || '1:1',
  };
  if (supportsMultiRes) imageConfig.imageSize = effectiveImageSize;

  console.log('Starting travel photo generation', {
    scenePrompt: scenePrompt.slice(0, 60),
    isGroup,
    hasSceneRef: !!sceneReferenceImage,
    aspectRatio,
    imageSize: effectiveImageSize,
  });

  const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [];

  if (isGroup) {
    for (const file of originalImage) {
      parts.push(await fileToPartAuto(file));
    }
  } else {
    parts.push(await fileToPartAuto(originalImage));
  }

  if (sceneReferenceImage) {
    parts.push(await fileToPartAuto(sceneReferenceImage));
  }
  parts.push(textPart);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig,
    },
  });
  console.log('Received response from model for travel photo.', response);
  return handleApiResponse(response, 'travel');
};
