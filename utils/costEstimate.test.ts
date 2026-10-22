/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { estimateGenerationCost, formatUsd } from './costEstimate';

describe('estimateGenerationCost', () => {
  it('multiplies unit price by quantity', () => {
    const e = estimateGenerationCost({
      modelId: 'google/gemini-3.1-flash-lite-image',
      quantity: 4,
      imageSize: '1K',
    });
    expect(e).toEqual({
      kind: 'known',
      unitUsd: 0.0336,
      quantity: 4,
      totalUsd: 0.1344,
    });
  });

  it('marks demo as free', () => {
    expect(
      estimateGenerationCost({
        modelId: 'gemini-3.1-flash-image',
        quantity: 2,
        isDemo: true,
      }),
    ).toEqual({ kind: 'free', quantity: 2 });
  });

  it('returns unknown when price table has no figure', () => {
    expect(estimateGenerationCost({ modelId: 'openai/gpt-image-1' })).toEqual({
      kind: 'unknown',
    });
  });
});

describe('formatUsd', () => {
  it('formats common amounts', () => {
    expect(formatUsd(0.0672)).toBe('0.07');
    expect(formatUsd(0.0336)).toBe('0.03');
    expect(formatUsd(0.134)).toBe('0.13');
    expect(formatUsd(0)).toBe('0.00');
  });
});
