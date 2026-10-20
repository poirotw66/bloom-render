/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { IMAGE_PRICE_TABLE, IMAGE_PRICING_LAST_UPDATED, lookupImagePriceUsd } from './imagePricing';

describe('imagePricing', () => {
  it('has a lastUpdated ISO date', () => {
    expect(IMAGE_PRICING_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('covers Gemini and OpenRouter model ids used in Settings', () => {
    const ids = new Set(IMAGE_PRICE_TABLE.map((e) => e.modelId));
    expect(ids.has('gemini-3.1-flash-lite-image')).toBe(true);
    expect(ids.has('gemini-3.1-flash-image')).toBe(true);
    expect(ids.has('gemini-3-pro-image')).toBe(true);
    expect(ids.has('google/gemini-2.5-flash-image')).toBe(true);
    expect(ids.has('google/gemini-3-pro-image')).toBe(true);
    expect(ids.has('openai/gpt-image-1')).toBe(true);
    expect(ids.has('black-forest-labs/flux.2-pro')).toBe(true);
  });

  it('returns verified Gemini Flash Lite 1K price', () => {
    expect(lookupImagePriceUsd('gemini-3.1-flash-lite-image', '1K')).toBe(0.0336);
  });

  it('returns unknown for gpt-image-1 (quality not selected in-app)', () => {
    expect(lookupImagePriceUsd('openai/gpt-image-1', '1K')).toBeUndefined();
  });

  it('returns undefined for unrecognized models', () => {
    expect(lookupImagePriceUsd('totally-unknown-model', '1K')).toBeUndefined();
  });
});
