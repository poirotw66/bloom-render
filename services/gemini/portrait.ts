/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Professional portrait (corporate /形象照) generation.
 */

import { GenerateContentResponse } from '@google/genai';
import type { PortraitType, OutputSpec } from '../../types';
import {
  PORTRAIT_TYPES,
  PORTRAIT_OUTPUT_SPECS,
  DEFAULT_PORTRAIT_TYPE,
  DEFAULT_PORTRAIT_SPEC,
} from '../../constants/portrait';
import {
  fileToPartAuto,
  getClient,
  getModel,
  handleApiResponse,
  type ServiceSettings,
} from './shared';
import { generatePortraitPrompt } from './prompts';

export interface GeneratePortraitOptions {
  portraitType?: PortraitType;
  outputSpec?: OutputSpec;
  settings?: ServiceSettings;
  variationIndex?: number; // For generating different variations
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

  const isGroup = Array.isArray(originalImage);
  const fileCount = isGroup ? originalImage.length : 1;

  const style = PORTRAIT_TYPES.find((t) => t.id === portraitType) || PORTRAIT_TYPES[0];
  const spec = PORTRAIT_OUTPUT_SPECS.find((s) => s.id === outputSpec) || PORTRAIT_OUTPUT_SPECS[0];

  // Generate prompt using unified prompt system
  const prompt = generatePortraitPrompt({
    portraitType: style,
    outputSpec: spec,
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

  console.log('Starting portrait generation', { portraitType, outputSpec, fileCount });
  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  console.log('Received response from model for professional portrait.', response);
  return handleApiResponse(response, 'portrait');
};
