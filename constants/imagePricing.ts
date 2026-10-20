/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Per-model, per-resolution USD estimates for one generated image (output only).
 * Input / prompt tokens are omitted — they vary with references and prompts.
 *
 * Sources (verify before updating):
 * - Gemini Developer API pricing:
 *   https://ai.google.dev/gemini-api/docs/pricing
 *   (Gemini 3.1 Flash Lite Image, Gemini 3.1 Flash Image, Gemini 3 Pro Image,
 *    Gemini 2.5 Flash Image footnotes for output-image token → USD equivalents)
 * - OpenRouter Images model endpoints (per-token / per-megapixel rates):
 *   https://openrouter.ai/api/v1/images/models/{id}/endpoints
 *   Model pages: https://openrouter.ai/google/gemini-2.5-flash-image
 *                https://openrouter.ai/google/gemini-3-pro-image
 *                https://openrouter.ai/black-forest-labs/flux.2-pro
 * - OpenAI GPT Image 1 image-generation table (quality × size):
 *   https://developers.openai.com/api/docs/models/gpt-image-1
 *
 * When a published per-image (or per-resolution) figure cannot be verified for
 * how BloomRender calls the API, leave the entry undefined → UI shows "price unknown".
 */

import type { ImageResolution } from '../services/imageProviders/models';

export type PricedResolution = ImageResolution | 'default';

/** USD for one output image at a given resolution, or undefined if unknown. */
export type ResolutionPriceMap = Partial<Record<PricedResolution, number>>;

export interface ModelPriceEntry {
  /** Provider-facing model id (Gemini id or OpenRouter id). */
  modelId: string;
  prices: ResolutionPriceMap;
  /** Short note shown in code comments / tests only. */
  notes?: string;
}

/**
 * lastUpdated: calendar date (UTC) when these figures were last checked
 * against the official pages listed above.
 */
export const IMAGE_PRICING_LAST_UPDATED = '2026-10-20';

/**
 * Standard (non-batch) paid-tier output-image USD.
 * Keys must match Settings model ids exactly.
 */
export const IMAGE_PRICE_TABLE: readonly ModelPriceEntry[] = [
  // Gemini Developer API — Flash Lite Image: $0.0336 / 1K (1120 tokens @ $30/M).
  {
    modelId: 'gemini-3.1-flash-lite-image',
    prices: { '1K': 0.0336, default: 0.0336 },
    notes: 'Gemini 3.1 Flash Lite Image — 1K only in-app',
  },
  // Gemini Developer API — Flash Image: 1K $0.067, 2K $0.101, 4K $0.151.
  {
    modelId: 'gemini-3.1-flash-image',
    prices: { '1K': 0.067, '2K': 0.101, '4K': 0.151, default: 0.067 },
  },
  // Gemini Developer API — Pro Image: 1K/2K $0.134, 4K $0.24.
  {
    modelId: 'gemini-3-pro-image',
    prices: { '1K': 0.134, '2K': 0.134, '4K': 0.24, default: 0.134 },
  },
  // OpenRouter / Google — Gemini 2.5 Flash Image: $0.039 / ≤1024² (1290 tokens @ $30/M).
  {
    modelId: 'google/gemini-2.5-flash-image',
    prices: { '1K': 0.039, default: 0.039 },
  },
  // OpenRouter mirrors Gemini 3 Pro Image output token rate ($120/M → same USD/image).
  {
    modelId: 'google/gemini-3-pro-image',
    prices: { '1K': 0.134, '2K': 0.134, '4K': 0.24, default: 0.134 },
  },
  // OpenAI gpt-image-1 quality is not selectable in BloomRender; OpenRouter quality
  // passthrough is unspecified → do not guess a single USD figure.
  {
    modelId: 'openai/gpt-image-1',
    prices: {},
    notes: 'Quality-dependent on OpenAI; in-app quality not set → unknown',
  },
  // OpenRouter endpoints: output_image $0.03 / megapixel (FLUX.2 Pro).
  // 1K ≈ 1.05 MP → $0.03; 2K ≈ 4.19 MP → $0.12 (rounded to published unit rate).
  {
    modelId: 'black-forest-labs/flux.2-pro',
    prices: { '1K': 0.03, '2K': 0.12, default: 0.03 },
    notes: 'OpenRouter: $0.03 per megapixel',
  },
  // Offline demo — no cloud spend.
  {
    modelId: 'demo-samples',
    prices: { '1K': 0, '2K': 0, '4K': 0, default: 0 },
  },
] as const;

const PRICE_BY_MODEL: Record<string, ResolutionPriceMap> = Object.fromEntries(
  IMAGE_PRICE_TABLE.map((e) => [e.modelId, e.prices]),
);

export function lookupImagePriceUsd(
  modelId: string,
  resolution?: string | null,
): number | undefined {
  const map = PRICE_BY_MODEL[modelId];
  if (!map) return undefined;
  const key = (
    resolution === '1K' || resolution === '2K' || resolution === '4K' ? resolution : 'default'
  ) as PricedResolution;
  if (typeof map[key] === 'number') return map[key];
  if (typeof map.default === 'number') return map.default;
  return undefined;
}
