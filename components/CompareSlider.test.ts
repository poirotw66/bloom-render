/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { clampPercent, positionFromClientX } from './CompareSlider';

describe('clampPercent', () => {
  it('keeps values inside 0-100', () => {
    expect(clampPercent(-30)).toBe(0);
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(180)).toBe(100);
  });
});

describe('positionFromClientX', () => {
  it('maps a pointer position to a percentage across the box', () => {
    // Box spans x=100..500 (400 wide); a pointer at 300 is halfway.
    expect(positionFromClientX(300, 100, 400)).toBe(50);
    expect(positionFromClientX(100, 100, 400)).toBe(0);
    expect(positionFromClientX(500, 100, 400)).toBe(100);
  });

  it('clamps a pointer dragged past either edge', () => {
    expect(positionFromClientX(-50, 100, 400)).toBe(0);
    expect(positionFromClientX(9999, 100, 400)).toBe(100);
  });

  it('returns null for a zero-width box instead of dividing by zero', () => {
    expect(positionFromClientX(300, 100, 0)).toBeNull();
  });
});
