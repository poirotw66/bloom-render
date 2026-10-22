/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Per-model, per-resolution USD estimates for one generated image (output only).
 * Input / prompt tokens are omitted — they vary with references and prompts.
 *
 * Sources (verify before updating):
 * - Gemini Developer API / Nano Banana image output prices (user-provided 2026-10):
 *   Nano Banana 2.1 & 2 Lite: $0.0336 / image
 *   Nano Banana 2: $0.0672 / image
 * - OpenRouter model pages (same Google slugs when listed):
 *   https://openrouter.ai/google/gemini-nano-banana-2.1
 *   https://openrouter.ai/google/gemini-3.1-flash-lite-image
 *   https://openrouter.ai/google/gemini-3.1-flash-image
 * - OpenAI GPT Image 1 / FLUX.2 Pro as before
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
export const IMAGE_PRICING_LAST_UPDATED = '2026-10-22';

/**
 * Standard (non-batch) paid-tier output-image USD.
 * Keys must match Settings model ids exactly.
 */
export const IMAGE_PRICE_TABLE: readonly ModelPriceEntry[] = [
  {
    modelId: 'gemini-nano-banana-2.1',
    prices: { '1K': 0.0336, '2K': 0.0336, '4K': 0.0336, default: 0.0336 },
    notes: 'Nano Banana 2.1 — $0.0336 / image',
  },
  {
    modelId: 'gemini-3.1-flash-lite-image',
    prices: { '1K': 0.0336, default: 0.0336 },
    notes: 'Nano Banana 2 Lite — 1K only in-app, $0.0336 / image',
  },
  {
    modelId: 'gemini-3.1-flash-image',
    prices: { '1K': 0.0672, '2K': 0.0672, '4K': 0.0672, default: 0.0672 },
    notes: 'Nano Banana 2 — $0.0672 / image',
  },
  // OpenRouter Google mirrors (confirmed on openrouter.ai/api/v1/models).
  {
    modelId: 'google/gemini-nano-banana-2.1',
    prices: { '1K': 0.0336, '2K': 0.0336, '4K': 0.0336, default: 0.0336 },
  },
  {
    modelId: 'google/gemini-3.1-flash-lite-image',
    prices: { '1K': 0.0336, default: 0.0336 },
  },
  {
    modelId: 'google/gemini-3.1-flash-image',
    prices: { '1K': 0.0672, '2K': 0.0672, '4K': 0.0672, default: 0.0672 },
  },
  // OpenAI gpt-image-1 quality is not selectable in BloomRender; OpenRouter quality
  // passthrough is unspecified → do not guess a single USD figure.
  {
    modelId: 'openai/gpt-image-1',
    prices: {},
    notes: 'Quality-dependent on OpenAI; in-app quality not set → unknown',
  },
  // OpenRouter endpoints: output_image $0.03 / megapixel (FLUX.2 Pro).
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
