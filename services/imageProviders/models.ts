/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Provider-facing model catalogs for Gemini + OpenRouter image generation.
 */

import {
  DEFAULT_MODEL,
  MODELS_SUPPORTING_MULTI_RESOLUTION,
  SUPPORTED_MODELS,
  type ModelType,
} from '../../constants/models';
import { DEMO_MODEL_ID } from './demoCatalog';
import type { ImageProviderId } from './types';

/**
 * OpenRouter image models. The three Google Nano Banana slugs mirror Gemini
 * (confirmed via openrouter.ai/api/v1/models). Non-Google options kept for BYOK.
 */
export const OPENROUTER_IMAGE_MODELS = [
  'google/gemini-nano-banana-2.1',
  'google/gemini-3.1-flash-lite-image',
  'google/gemini-3.1-flash-image',
  'openai/gpt-image-1',
  'black-forest-labs/flux.2-pro',
] as const;

export type OpenRouterModel = (typeof OPENROUTER_IMAGE_MODELS)[number];

export const DEFAULT_OPENROUTER_MODEL: OpenRouterModel = 'google/gemini-3.1-flash-lite-image';

export type ImageResolution = '1K' | '2K' | '4K';

export const OPENROUTER_MODEL_RESOLUTIONS: Record<string, ImageResolution[]> = {
  'google/gemini-nano-banana-2.1': ['1K', '2K', '4K'],
  'google/gemini-3.1-flash-lite-image': ['1K'],
  'google/gemini-3.1-flash-image': ['1K', '2K', '4K'],
  'openai/gpt-image-1': ['1K', '2K'],
  'black-forest-labs/flux.2-pro': ['1K', '2K'],
};

export const OPENROUTER_MODEL_LABEL_KEYS: Record<OpenRouterModel, string> = {
  'google/gemini-nano-banana-2.1': 'settings.openrouter.model.nanoBanana21',
  'google/gemini-3.1-flash-lite-image': 'settings.openrouter.model.nanoBanana2Lite',
  'google/gemini-3.1-flash-image': 'settings.openrouter.model.nanoBanana2',
  'openai/gpt-image-1': 'settings.openrouter.model.gptImage1',
  'black-forest-labs/flux.2-pro': 'settings.openrouter.model.flux2pro',
};

const LEGACY_OPENROUTER_MAP: Record<string, OpenRouterModel> = {
  'google/gemini-2.5-flash-image': DEFAULT_OPENROUTER_MODEL,
  'google/gemini-3-pro-image': DEFAULT_OPENROUTER_MODEL,
  'google/gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image',
};

export function isOpenRouterModel(model: string): model is OpenRouterModel {
  return (OPENROUTER_IMAGE_MODELS as readonly string[]).includes(model);
}

export function resolveStoredOpenRouterModel(stored: string | null): OpenRouterModel {
  if (stored && isOpenRouterModel(stored)) return stored;
  if (stored && LEGACY_OPENROUTER_MAP[stored]) return LEGACY_OPENROUTER_MAP[stored]!;
  return DEFAULT_OPENROUTER_MODEL;
}

export function modelsForProvider(provider: ImageProviderId): readonly string[] {
  if (provider === 'openrouter') return OPENROUTER_IMAGE_MODELS;
  if (provider === 'demo') return [DEMO_MODEL_ID];
  return SUPPORTED_MODELS;
}

export function defaultModelForProvider(provider: ImageProviderId): string {
  if (provider === 'openrouter') return DEFAULT_OPENROUTER_MODEL;
  if (provider === 'demo') return DEMO_MODEL_ID;
  return DEFAULT_MODEL;
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
