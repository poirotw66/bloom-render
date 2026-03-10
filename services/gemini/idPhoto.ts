/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ID / passport photo generation.
 */

import { GenerateContentResponse } from '@google/genai';
import type { RetouchLevel, IdPhotoType, OutputSpec, ClothingOption } from '../../types';
import {
  RETOUCH_LEVELS,
  ID_PHOTO_TYPES,
  OUTPUT_SPECS,
  CLOTHING_OPTIONS,
  DEFAULT_ID_TYPE,
  DEFAULT_RETOUCH_LEVEL,
  DEFAULT_OUTPUT_SPEC,
  DEFAULT_CLOTHING_OPTION,
} from '../../constants/idPhoto';
import {
  fileToPartAuto,
  getClient,
  getModel,
  handleApiResponse,
  type ServiceSettings,
} from './shared';
import { generateIdPhotoPrompt } from './prompts';

export interface GenerateIdPhotoOptions {
  retouchLevel?: RetouchLevel;
  idType?: IdPhotoType;
  outputSpec?: OutputSpec;
  clothingOption?: ClothingOption;
  clothingCustomText?: string;
  clothingReferenceImage?: File;
  settings?: ServiceSettings;
  variationIndex?: number; // For generating different variations
}

/**
 * Generates a professional ID / passport-style photo from a portrait.
 */
export const generateIdPhoto = async (
  originalImage: File,
  options?: GenerateIdPhotoOptions | ServiceSettings,
): Promise<string> => {
  const isNewFormat =
    options &&
    typeof options === 'object' &&
    ('retouchLevel' in options ||
      'idType' in options ||
      'outputSpec' in options ||
      'clothingOption' in options);
  const opts: GenerateIdPhotoOptions = isNewFormat
    ? (options as GenerateIdPhotoOptions)
    : { settings: options as ServiceSettings };
  const retouchLevel = opts.retouchLevel ?? DEFAULT_RETOUCH_LEVEL;
  const idType = opts.idType ?? DEFAULT_ID_TYPE;
  const outputSpec = opts.outputSpec ?? DEFAULT_OUTPUT_SPEC;
  const clothingOption = opts.clothingOption ?? DEFAULT_CLOTHING_OPTION;
  const clothingCustomText = opts.clothingCustomText?.trim() ?? '';
  const clothingReferenceImage = opts.clothingReferenceImage ?? null;
  const serviceSettings = opts.settings;

  const level = RETOUCH_LEVELS.find((l) => l.id === retouchLevel) || RETOUCH_LEVELS[1];
  const type = ID_PHOTO_TYPES.find((t) => t.id === idType) || ID_PHOTO_TYPES[0];
  const spec = OUTPUT_SPECS.find((s) => s.id === outputSpec) || OUTPUT_SPECS[0];
  const clothingEntry =
    CLOTHING_OPTIONS.find((c) => c.id === clothingOption) || CLOTHING_OPTIONS[0];
  let clothingHint: string;
  if (clothingOption !== 'custom') {
    clothingHint = clothingEntry.promptHint ?? '';
  } else if (clothingReferenceImage && clothingCustomText) {
    clothingHint = `Dress the person in the first image in the same or similar outfit as shown in the second (reference) image. Additional instructions: ${clothingCustomText}.`;
  } else if (clothingReferenceImage) {
    clothingHint =
      'Dress the person in the first image in the same or similar outfit as shown in the second (reference) image.';
  } else if (clothingCustomText) {
    clothingHint = `Dress the person in the following attire: ${clothingCustomText}.`;
  } else {
    clothingHint = 'Use appropriate professional attire suitable for an ID photo.';
  }

  // Generate prompt using unified prompt system
  const prompt = generateIdPhotoPrompt({
    retouchLevel: level,
    idType: type,
    outputSpec: spec,
    clothingHint,
    clothingReferenceImage: clothingReferenceImage ?? undefined,
    variationIndex: opts.variationIndex,
  });
  const textPart = { text: prompt };

  console.log('Starting ID photo generation', {
    retouchLevel,
    idType,
    outputSpec,
    clothingOption,
    hasClothingRefImage: !!clothingReferenceImage,
  });
  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);
  const originalImagePart = await fileToPartAuto(originalImage);
  const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [
    originalImagePart,
  ];
  if (clothingReferenceImage) {
    parts.push(await fileToPartAuto(clothingReferenceImage));
  }
  parts.push(textPart);

  console.log(`Sending image(s) to model (${model}) for ID photo...`);
  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
  });
  console.log('Received response from model for ID photo.', response);
  return handleApiResponse(response, 'id-photo');
};
