/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ID / passport photo generation.
 */

import { GenerateContentResponse } from '@google/genai';
import type {
  RetouchLevel,
  IdPhotoType,
  OutputSpec,
  ClothingOption,
} from '../../types';
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
import { fileToPart, getClient, getModel, handleApiResponse, type ServiceSettings } from './shared';

/** Base positive: identity, expression, background, lighting (no retouch, no framing) */
const ID_PHOTO_BASE_POSITIVE = `Korean ID photo, passport-style photo, professional studio photo retouch, use the same person, preserve identity, same face, same facial structure, no face change, no age change, no gender change, neutral expression, mouth closed, eyes open, looking straight at camera, clean pure white background, simple and clean background, even and soft studio lighting, no shadow on face, no shadow on background, realistic, photorealistic, looks like a real photo, not stylized, not artistic, not a painting, not an illustration`;

/** Base negative (must avoid) */
const ID_PHOTO_BASE_NEGATIVE = `different person, change face, change identity, face swap, wrong person, beautify, over-beautify, beauty filter, meitu, snow app, filter, plastic skin, doll face, over-smooth, airbrushed, fake skin, CGI, AI face, AI generated look, anime, cartoon, illustration, painting, 3d render, smile, laughing, open mouth, teeth, exaggerated expression, tilted head, angle view, side view, looking away, dramatic lighting, rim light, hard light, strong shadow, shadow on face, shadow on background, low quality, blurry, noise, jpeg artifacts, oversharpen, deformed, distorted, asymmetrical face, extra face, extra features, bad anatomy, big eyes, small face, unrealistic face, beauty face, idol face`;

export interface GenerateIdPhotoOptions {
  retouchLevel?: RetouchLevel;
  idType?: IdPhotoType;
  outputSpec?: OutputSpec;
  clothingOption?: ClothingOption;
  clothingCustomText?: string;
  clothingReferenceImage?: File;
  settings?: ServiceSettings;
}

/**
 * Generates a professional ID / passport-style photo from a portrait.
 */
export const generateIdPhoto = async (
  originalImage: File,
  options?: GenerateIdPhotoOptions | ServiceSettings
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

  const positive = [
    ID_PHOTO_BASE_POSITIVE,
    spec.cropHint,
    level.positiveModifier,
    type.promptHint,
    clothingHint,
  ]
    .filter(Boolean)
    .join(' ');
  const negative = [ID_PHOTO_BASE_NEGATIVE, level.negativeExtra].filter(Boolean).join(' ');

  const introTwoImages = clothingReferenceImage
    ? 'Note: You are given TWO images. The first image is the portrait to transform. The second image is a reference for the desired clothing/outfit.\n\n'
    : '';

  const prompt = `${introTwoImages}You are an expert ID and passport photo retouching AI. Transform the provided portrait into a professional, compliant ID/passport-style photo.

Requirements (MUST follow):
${positive}

Never do (MUST avoid):
${negative}

Output: Return ONLY the final ID/passport-style image. Do not return any text.`;
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
  const originalImagePart = await fileToPart(originalImage);
  const parts: Array<
    { inlineData?: { mimeType: string; data: string } } | { text: string }
  > = [originalImagePart];
  if (clothingReferenceImage) {
    parts.push(await fileToPart(clothingReferenceImage));
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
