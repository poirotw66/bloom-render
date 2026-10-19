import {
  DEFAULT_MODEL,
  MODELS_SUPPORTING_MULTI_RESOLUTION,
  SUPPORTED_MODELS,
  type ModelType,
} from '../../constants/models';
import type { ImageProviderId } from './types';

export const OPENROUTER_IMAGE_MODELS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image',
  'openai/gpt-image-1',
  'black-forest-labs/flux.2-pro',
] as const;

export type OpenRouterModel = (typeof OPENROUTER_IMAGE_MODELS)[number];

export const DEFAULT_OPENROUTER_MODEL: OpenRouterModel = OPENROUTER_IMAGE_MODELS[0];

export type ImageResolution = '1K' | '2K' | '4K';

export const OPENROUTER_MODEL_RESOLUTIONS: Record<string, ImageResolution[]> = {
  'google/gemini-2.5-flash-image': ['1K'],
  'google/gemini-3-pro-image': ['1K', '2K', '4K'],
  'openai/gpt-image-1': ['1K', '2K'],
  'black-forest-labs/flux.2-pro': ['1K', '2K'],
};

export const OPENROUTER_MODEL_LABEL_KEYS: Record<OpenRouterModel, string> = {
  'google/gemini-2.5-flash-image': 'settings.openrouter.model.flash25',
  'google/gemini-3-pro-image': 'settings.openrouter.model.pro3',
  'openai/gpt-image-1': 'settings.openrouter.model.gptImage1',
  'black-forest-labs/flux.2-pro': 'settings.openrouter.model.flux2pro',
};

export function isOpenRouterModel(model: string): model is OpenRouterModel {
  return (OPENROUTER_IMAGE_MODELS as readonly string[]).includes(model);
}

export function resolveStoredOpenRouterModel(stored: string | null): OpenRouterModel {
  if (stored && isOpenRouterModel(stored)) return stored;
  return DEFAULT_OPENROUTER_MODEL;
}

export function modelsForProvider(provider: ImageProviderId): readonly string[] {
  return provider === 'openrouter' ? OPENROUTER_IMAGE_MODELS : SUPPORTED_MODELS;
}

export function defaultModelForProvider(provider: ImageProviderId): string {
  return provider === 'openrouter' ? DEFAULT_OPENROUTER_MODEL : DEFAULT_MODEL;
}

/**
 * Whether the given model id supports 2K/4K output.
 * Accepts Gemini ids and OpenRouter ids so UI can pass the effective model.
 */
export function modelSupportsMultiResolution(model?: string): boolean {
  if (!model) return false;
  if ((MODELS_SUPPORTING_MULTI_RESOLUTION as readonly string[]).includes(model as ModelType)) {
    return true;
  }
  const allowed = OPENROUTER_MODEL_RESOLUTIONS[model];
  return !!allowed && allowed.some((r) => r === '2K' || r === '4K');
}
