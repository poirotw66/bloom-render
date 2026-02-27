/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Virtual try-on: generate image of person wearing provided clothing.
 */

import { GenerateContentResponse } from '@google/genai';
import { fileToPartAuto, getClient, getModel, handleApiResponse, supportsMultiResolution, type ServiceSettings } from './shared';
import { generateTryOnPrompt } from './prompts/tryOn';

export interface GenerateTryOnOptions {
  settings?: ServiceSettings;
  /** For multiple outputs: pose/background variation index (0, 1, 2, ...). */
  variationIndex?: number;
  /** User-selected background scene (prompt hint). */
  backgroundHint?: string;
  /** User-selected style/mood (prompt hint). */
  styleHint?: string;
  /** Output size: 1K (Gemini 2 only), or 1K/2K/4K (Gemini 3). */
  outputSize?: '1K' | '2K' | '4K';
  /** Aspect ratio: 1:1, 16:9, 9:16. */
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

/**
 * Generates one image of the person (first file) wearing the clothing (remaining files)
 * in a new fashion catalog-style scene. Options control background and style for aspirational, desirable output.
 * @param personImage - One photo of the person (full body or upper body works best).
 * @param clothingImages - One or more photos of clothing (product, flat lay, or on mannequin).
 */
export const generateVirtualTryOn = async (
  personImage: File,
  clothingImages: File[],
  options: GenerateTryOnOptions = {}
): Promise<string> => {
  const serviceSettings = options.settings;

  const prompt = generateTryOnPrompt({
    clothingCount: clothingImages.length,
    variationIndex: options.variationIndex,
    backgroundHint: options.backgroundHint,
    styleHint: options.styleHint,
  });
  const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [];

  parts.push(await fileToPartAuto(personImage));
  for (const file of clothingImages) {
    parts.push(await fileToPartAuto(file));
  }
  parts.push({ text: prompt });

  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);
  const supportsMultiRes = supportsMultiResolution(model);
  const effectiveSize: '1K' | '2K' | '4K' = supportsMultiRes ? (options.outputSize || '1K') : '1K';
  const aspectRatio = options.aspectRatio || '9:16';

  const imageConfig: { aspectRatio: string; imageSize?: '1K' | '2K' | '4K' } = {
    aspectRatio,
  };
  if (supportsMultiRes) imageConfig.imageSize = effectiveSize;

  console.log('Starting virtual try-on generation', {
    clothingCount: clothingImages.length,
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

  return handleApiResponse(response, 'try-on');
};
