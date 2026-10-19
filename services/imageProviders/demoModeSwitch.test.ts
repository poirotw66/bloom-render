/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Pure helpers for switching into demo mode (no React tree required).
 */

import { describe, expect, it } from 'vitest';
import { DEMO_MODEL_ID } from './demoCatalog';
import {
  defaultModelForProvider,
  getImageProvider,
  isDemoProvider,
  isImageProviderId,
  modelsForProvider,
} from './index';

describe('demo mode switch helpers', () => {
  it('lets Settings persist and restore the demo provider id', () => {
    expect(isImageProviderId('demo')).toBe(true);
    expect(isDemoProvider('demo')).toBe(true);
  });

  it('routes getImageProvider(demo) to the offline provider', () => {
    const provider = getImageProvider('demo');
    expect(provider.id).toBe('demo');
  });

  it('uses the demo model when the provider is demo', () => {
    expect(defaultModelForProvider('demo')).toBe(DEMO_MODEL_ID);
    expect(modelsForProvider('demo')).toContain(DEMO_MODEL_ID);
    expect(defaultModelForProvider('gemini')).not.toBe(DEMO_MODEL_ID);
  });
});
