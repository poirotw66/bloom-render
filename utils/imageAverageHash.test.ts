/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { averageHashFromGray, hammingDistance } from './imageAverageHash';

describe('imageAverageHash', () => {
  it('hashes a flat gray block to all-ones when every pixel equals the mean', () => {
    const pixels = new Array(64).fill(128);
    expect(averageHashFromGray(pixels)).toBe((1n << 64n) - 1n);
  });

  it('differs for opposite checkerboards', () => {
    const a = Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? 255 : 0) as number);
    const b = Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? 0 : 255) as number);
    const ha = averageHashFromGray(a);
    const hb = averageHashFromGray(b);
    expect(ha).not.toBe(hb);
    expect(hammingDistance(ha, hb)).toBe(64);
  });
});
