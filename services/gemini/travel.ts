/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel photo generation: same person in selected scene.
 */

import { GenerateContentResponse } from '@google/genai';
import { TRAVEL_POSITIVE_TEMPLATE, TRAVEL_NEGATIVE } from '../../constants/travel';
import { fileToPartAuto, getClient, getModel, handleApiResponse, type ServiceSettings } from './shared';

export interface GenerateTravelPhotoOptions {
  scenePrompt: string;
  sceneReferenceImage?: File;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  imageSize?: '1K' | '2K' | '4K';
  settings?: ServiceSettings;
}

/**
 * Generates a travel photo: the same person in a selected scene.
 */
export const generateTravelPhoto = async (
  originalImage: File | File[],
  options: GenerateTravelPhotoOptions
): Promise<string> => {
  const {
    scenePrompt,
    sceneReferenceImage,
    aspectRatio = '1:1',
    imageSize: requestedSize,
    settings: serviceSettings,
  } = options;

  const isGroup = Array.isArray(originalImage);
  const sceneForTemplate = sceneReferenceImage
    ? 'at the location shown in the reference image, but with a new creative composition and angle' +
      (scenePrompt.trim() ? `. ${scenePrompt.trim()}` : '')
    : scenePrompt.trim();
  const positive = TRAVEL_POSITIVE_TEMPLATE.replace('{SCENE}', sceneForTemplate);
  const aspectHint =
    aspectRatio === '16:9'
      ? 'Output in 16:9 landscape aspect ratio.'
      : aspectRatio === '9:16'
        ? 'Output in 9:16 portrait aspect ratio.'
        : 'Output in 1:1 square aspect ratio.';

  const introRef = sceneReferenceImage
    ? `Note: You are given ${isGroup ? originalImage.length + 1 : 2} images. ${isGroup ? originalImage.length : 1} User portrait(s) and 1 Location/Style Reference.\n` +
      'CRITICAL INSTRUCTION: Use the location reference image as a SOURCE OF INSPIRATION for the environment, lighting, and mood. ' +
      'Do NOT copy the reference image composition exactly. ' +
      'Create a FRESH, NEW composition or camera angle based on that location. ' +
      'Make it look like a different photo taken at the same place, possibly from a different viewpoint.\n\n'
    : isGroup
      ? `Note: You are given ${originalImage.length} user portraits. Create a group photo featuring all of them.\n\n`
      : '';

  const prompt = `${introRef}You are an expert travel photo AI. Transform the provided portrait(s) so the person or people appear in the following scene.

Requirements (MUST follow):
${positive}

Never do (MUST avoid):
${TRAVEL_NEGATIVE}

${aspectHint}

Output: Return ONLY the final travel photo. Do not return any text.`;
  const textPart = { text: prompt };

  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);
  const isPro = model === 'gemini-3-pro-image-preview';
  const effectiveImageSize: '1K' | '2K' | '4K' = isPro ? (requestedSize || '1K') : '1K';

  const imageConfig: { aspectRatio: string; imageSize?: '1K' | '2K' | '4K' } = {
    aspectRatio: aspectRatio || '1:1',
  };
  if (isPro) imageConfig.imageSize = effectiveImageSize;

  console.log('Starting travel photo generation', {
    scenePrompt: scenePrompt.slice(0, 60),
    isGroup,
    hasSceneRef: !!sceneReferenceImage,
    aspectRatio,
    imageSize: effectiveImageSize,
  });

  const parts: Array<
    { inlineData?: { mimeType: string; data: string } } | { text: string }
  > = [];

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
