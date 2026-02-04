/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single entry for all Gemini image services. Implementation lives in services/gemini/*.
 */

export {
  generateEditedImage,
  generateFilteredImage,
  generateAdjustedImage,
  generateIdPhoto,
  generateProfessionalPortrait,
  generateThemedPhoto,
  generateTravelPhoto,
  generateImageFromText,
  generateOptimizedPrompt,
  type ServiceSettings,
  type GenerateIdPhotoOptions,
  type GeneratePortraitOptions,
  type GenerateThemedPhotoOptions,
  type GenerateTravelPhotoOptions,
} from './gemini';

export type {
  RetouchLevel,
  IdPhotoType,
  OutputSpec,
  ClothingOption,
  PortraitType,
  ThemedType,
} from './gemini';
