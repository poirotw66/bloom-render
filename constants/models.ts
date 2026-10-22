/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Supported Gemini image generation models (Nano Banana family).
 */

/** Default for new users and invalid/legacy stored selections. */
export const DEFAULT_MODEL = 'gemini-3.1-flash-lite-image' as const;

export type ModelType =
  | 'gemini-nano-banana-2.1'
  | 'gemini-3.1-flash-lite-image'
  | 'gemini-3.1-flash-image';

/** Display order in the Settings model picker. */
export const SUPPORTED_MODELS: readonly ModelType[] = [
  'gemini-nano-banana-2.1',
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
] as const;

/** Model IDs that support multiple output resolutions (e.g. 1K, 2K, 4K). */
export const MODELS_SUPPORTING_MULTI_RESOLUTION = [
  'gemini-nano-banana-2.1',
  'gemini-3.1-flash-image',
] as const;

export const MODEL_LABEL_KEYS: Record<ModelType, string> = {
  'gemini-nano-banana-2.1': 'settings.model.nanoBanana21',
  'gemini-3.1-flash-lite-image': 'settings.model.nanoBanana2Lite',
  'gemini-3.1-flash-image': 'settings.model.nanoBanana2',
};

export const MODEL_DESC_KEYS: Record<ModelType, string> = {
  'gemini-nano-banana-2.1': 'settings.model.nanoBanana21_desc',
  'gemini-3.1-flash-lite-image': 'settings.model.nanoBanana2Lite_desc',
  'gemini-3.1-flash-image': 'settings.model.nanoBanana2_desc',
};

const LEGACY_MODEL_MAP: Record<string, ModelType> = {
  'gemini-2.5-flash-image': DEFAULT_MODEL,
  'gemini-3.1-flash-image-preview': 'gemini-3.1-flash-image',
  'gemini-3-pro-image': DEFAULT_MODEL,
  'gemini-3-pro-image-preview': DEFAULT_MODEL,
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
