/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Supported Gemini image generation models.
 */

export const DEFAULT_MODEL = 'gemini-3.1-flash-lite-image' as const;

export type ModelType =
  | 'gemini-3.1-flash-lite-image'
  | 'gemini-3.1-flash-image'
  | 'gemini-3-pro-image';

export const SUPPORTED_MODELS: readonly ModelType[] = [
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
] as const;

/** Model IDs that support multiple output resolutions (e.g. 1K, 2K, 4K). */
export const MODELS_SUPPORTING_MULTI_RESOLUTION = [
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
] as const;

export const MODEL_LABEL_KEYS: Record<ModelType, string> = {
  'gemini-3.1-flash-lite-image': 'settings.model.flashLite',
  'gemini-3.1-flash-image': 'settings.model.flash31',
  'gemini-3-pro-image': 'settings.model.pro',
};

const LEGACY_MODEL_MAP: Record<string, ModelType> = {
  'gemini-2.5-flash-image': 'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image-preview': 'gemini-3.1-flash-image',
  'gemini-3-pro-image-preview': 'gemini-3-pro-image',
};

export function isSupportedModel(model: string): model is ModelType {
  return (SUPPORTED_MODELS as readonly string[]).includes(model);
}

export function resolveStoredModel(stored: string | null): ModelType {
  if (!stored) return DEFAULT_MODEL;
  if (isSupportedModel(stored)) return stored;
  return LEGACY_MODEL_MAP[stored] ?? DEFAULT_MODEL;
}

export function supportsMultiResolution(model?: string): boolean {
  return !!model && (MODELS_SUPPORTING_MULTI_RESOLUTION as readonly string[]).includes(model);
}
