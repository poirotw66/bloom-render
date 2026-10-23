/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Feature capability checks for image providers.
 */

import type { ImageProviderId } from './types';

/** Max reference images accepted for multi-person viral synthesis. */
export const MULTI_PERSON_PROVIDER_MAX = 4;

/**
 * Whether the provider can accept multiple reference portraits in one call.
 * Gemini, OpenRouter, and demo all map the full `images[]` array today.
 */
export function providerSupportsMultiReference(
  id: ImageProviderId | string | undefined | null,
): boolean {
  return id === 'gemini' || id === 'openrouter' || id === 'demo';
}

export function multiReferenceLimit(
  id: ImageProviderId | string | undefined | null,
): number | null {
  if (!providerSupportsMultiReference(id)) return null;
  return MULTI_PERSON_PROVIDER_MAX;
}
