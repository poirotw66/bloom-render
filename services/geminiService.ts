/**
 * @license
 * SPDX-License-Identifier: MIT
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
  generateVirtualTryOn,
  generateRestoredPhoto,
  type ServiceSettings,
  type GenerateIdPhotoOptions,
  type GeneratePortraitOptions,
  type GenerateThemedPhotoOptions,
  type GenerateTravelPhotoOptions,
  type GenerateTryOnOptions,
  type RestoreOptions,
} from './gemini';

export type {
  RetouchLevel,
  IdPhotoType,
  OutputSpec,
  ClothingOption,
  PortraitType,
  ThemedType,
} from './gemini';
