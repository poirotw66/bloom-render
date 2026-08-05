/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Text-to-image generation.
 */

import { GenerateContentResponse } from '@google/genai';
import { logger } from '../../utils/logger';
import {
  fileToPartAuto,
  getClient,
  getModel,
  handleApiResponse,
  supportsMultiResolution,
  type ServiceSettings,
} from './shared';

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
  const ai = getClient(settings);
  const model = getModel(settings);
  const textPrompt = buildGeneratePrompt(prompt, hasReference);
  const referencePart = referenceImage ? await fileToPartAuto(referenceImage) : null;

  const promises = Array.from({ length: numberOfImages }).map(async () => {
    const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [];
    if (referencePart) parts.push(referencePart);
    parts.push({ text: textPrompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        abortSignal: settings?.abortSignal,
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          ...(supportsMultiResolution(model) ? { imageSize: '1K' as const } : {}),
        },
      },
    });
    return handleApiResponse(response, 'generation');
  });

  const results = await Promise.all(promises);
  logger.debug(`Generated ${results.length} images.`);

  return results;
};
