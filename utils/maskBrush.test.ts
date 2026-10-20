// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
  displayToNaturalPoint,
  drawMaskStroke,
  maskHasPaint,
  renderMaskStrokes,
} from './maskBrush';

describe('maskBrush helpers', () => {
  it('maps display coordinates into natural image space', () => {
    const rect = { left: 10, top: 20, width: 100, height: 50 } as DOMRectReadOnly;
    expect(displayToNaturalPoint(10, 20, rect, 200, 100)).toEqual({ x: 0, y: 0 });
    expect(displayToNaturalPoint(60, 45, rect, 200, 100)).toEqual({ x: 100, y: 50 });
    expect(displayToNaturalPoint(200, 200, rect, 200, 100)).toEqual({ x: 200, y: 100 });
  });

  it('exposes sane brush size bounds', () => {
    expect(MIN_BRUSH_SIZE).toBeLessThan(DEFAULT_BRUSH_SIZE);
    expect(DEFAULT_BRUSH_SIZE).toBeLessThan(MAX_BRUSH_SIZE);
  });

  it('exports stroke drawing helpers for the canvas overlay', () => {
    // Pixel-level canvas assertions need a real 2D context (browser / node-canvas).
    // Unit coverage here locks the public surface used by useMaskBrush.
    expect(typeof drawMaskStroke).toBe('function');
    expect(typeof renderMaskStrokes).toBe('function');
    expect(typeof maskHasPaint).toBe('function');
  });
});
