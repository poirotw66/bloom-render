/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { LOCAL_ENHANCE_MODELS, REMOVE_BG_MODEL, UPSCALE_2X_MODEL, modelForTask } from './models';

describe('localEnhance models', () => {
  it('lists remove-bg and upscale-2x with license + size metadata', () => {
    expect(LOCAL_ENHANCE_MODELS).toHaveLength(2);
    for (const m of LOCAL_ENHANCE_MODELS) {
      expect(m.modelId.length).toBeGreaterThan(0);
      expect(m.approxSizeMb).toBeGreaterThan(0);
      expect(m.license.length).toBeGreaterThan(0);
      expect(m.modelCardUrl).toMatch(/^https:\/\//);
    }
  });

  it('resolves tasks', () => {
    expect(modelForTask('remove-bg')).toBe(REMOVE_BG_MODEL);
    expect(modelForTask('upscale-2x')).toBe(UPSCALE_2X_MODEL);
    expect(UPSCALE_2X_MODEL.scale).toBe(2);
  });
});
