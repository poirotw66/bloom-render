/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  multiReferenceLimit,
  MULTI_PERSON_PROVIDER_MAX,
  providerSupportsMultiReference,
} from './capabilities';

describe('image provider capabilities', () => {
  it('supports multi-reference on gemini, openrouter, and demo', () => {
    expect(providerSupportsMultiReference('gemini')).toBe(true);
    expect(providerSupportsMultiReference('openrouter')).toBe(true);
    expect(providerSupportsMultiReference('demo')).toBe(true);
    expect(providerSupportsMultiReference('unknown')).toBe(false);
    expect(multiReferenceLimit('gemini')).toBe(MULTI_PERSON_PROVIDER_MAX);
    expect(multiReferenceLimit('other')).toBeNull();
  });
});
