/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini-based image services: edit, filter, adjustment, ID photo, portrait, themed, travel, text-to-image, prompt optimization.
 * Shared helpers in shared.ts; domain logic in separate modules.
 */

export type { ServiceSettings } from './shared';
export { fileToPart, handleApiResponse, getClient, getModel } from './shared';

export { generateEditedImage } from './edit';
export { generateFilteredImage } from './filter';
export { generateAdjustedImage } from './adjustment';

export {
  generateIdPhoto,
  type GenerateIdPhotoOptions,
} from './idPhoto';

export {
  generateProfessionalPortrait,
  type GeneratePortraitOptions,
} from './portrait';

export {
  generateThemedPhoto,
  type GenerateThemedPhotoOptions,
} from './themed';

export {
  generateTravelPhoto,
  type GenerateTravelPhotoOptions,
} from './travel';

export { generateImageFromText } from './generate';
export { generateOptimizedPrompt } from './optimizePrompt';

// Re-export domain types from root for consumers that import from geminiService
export type {
  RetouchLevel,
  IdPhotoType,
  OutputSpec,
  ClothingOption,
  PortraitType,
  ThemedType,
} from '../../types';
