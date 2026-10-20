/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { resolveEnhanceDevice } from './device';

describe('resolveEnhanceDevice', () => {
  it('returns wasm when WebGPU is missing', async () => {
    expect(await resolveEnhanceDevice(undefined)).toBe('wasm');
    expect(await resolveEnhanceDevice({})).toBe('wasm');
  });

  it('returns webgpu when an adapter is available', async () => {
    expect(
      await resolveEnhanceDevice({
        requestAdapter: async () => ({ name: 'fake' }),
      }),
    ).toBe('webgpu');
  });

  it('falls back to wasm when requestAdapter fails or returns null', async () => {
    expect(
      await resolveEnhanceDevice({
        requestAdapter: async () => null,
      }),
    ).toBe('wasm');
    expect(
      await resolveEnhanceDevice({
        requestAdapter: async () => {
          throw new Error('no gpu');
        },
      }),
    ).toBe('wasm');
  });
});
