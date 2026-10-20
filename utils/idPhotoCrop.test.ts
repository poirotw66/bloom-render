/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { computeIdPhotoCropRect } from './idPhotoCrop';

describe('computeIdPhotoCropRect', () => {
  it('center-crops a landscape source to a portrait ID aspect', () => {
    const rect = computeIdPhotoCropRect(1600, 900, 413, 531);
    expect(rect.sw / rect.sh).toBeCloseTo(413 / 531, 3);
    expect(rect.sw).toBeLessThanOrEqual(1600);
    expect(rect.sh).toBeLessThanOrEqual(900);
    expect(rect.sx).toBeGreaterThanOrEqual(0);
    expect(rect.sy).toBeGreaterThanOrEqual(0);
    expect(rect.sx + rect.sw).toBeLessThanOrEqual(1600);
    expect(rect.sy + rect.sh).toBeLessThanOrEqual(900);
  });

  it('biases upward when no face is provided', () => {
    const centered = (900 - 900) / 2; // full height case
    const rect = computeIdPhotoCropRect(800, 1200, 413, 531);
    // Source is taller than needed — sy should be above pure center.
    const pureCenterSy = (1200 - rect.sh) / 2;
    expect(rect.sy).toBeLessThanOrEqual(pureCenterSy);
    void centered;
  });

  it('keeps the face in frame when a face box is provided', () => {
    const face = { x: 400, y: 200, width: 200, height: 260 };
    const rect = computeIdPhotoCropRect(1000, 1200, 600, 600, face);
    const faceCx = face.x + face.width / 2;
    const faceCy = face.y + face.height / 2;
    expect(faceCx).toBeGreaterThanOrEqual(rect.sx);
    expect(faceCx).toBeLessThanOrEqual(rect.sx + rect.sw);
    expect(faceCy).toBeGreaterThanOrEqual(rect.sy);
    expect(faceCy).toBeLessThanOrEqual(rect.sy + rect.sh);
  });
});
