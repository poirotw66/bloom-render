/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { providerSupportsNativeMask } from './types';

describe('providerSupportsNativeMask', () => {
  it('is false for the BYOK providers used in BloomRender today', () => {
    expect(providerSupportsNativeMask('gemini')).toBe(false);
    expect(providerSupportsNativeMask('openrouter')).toBe(false);
    expect(providerSupportsNativeMask('demo')).toBe(false);
  });
});
