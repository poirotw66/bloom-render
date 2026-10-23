/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  clampStyleCollageSelectionCount,
  computeStyleCollageLayout,
  isValidStyleCollageSelectionCount,
  STYLE_COLLAGE_MAX,
  STYLE_COLLAGE_MIN,
  styleCollageGridForCount,
} from './styleCollageLayout';

describe('styleCollageLayout', () => {
  it('clamps selection count to 4–6', () => {
    expect(clampStyleCollageSelectionCount(2)).toBe(STYLE_COLLAGE_MIN);
    expect(clampStyleCollageSelectionCount(4)).toBe(4);
    expect(clampStyleCollageSelectionCount(6)).toBe(6);
    expect(clampStyleCollageSelectionCount(99)).toBe(STYLE_COLLAGE_MAX);
  });

  it('validates integer selection counts only', () => {
    expect(isValidStyleCollageSelectionCount(4)).toBe(true);
    expect(isValidStyleCollageSelectionCount(5)).toBe(true);
    expect(isValidStyleCollageSelectionCount(3)).toBe(false);
    expect(isValidStyleCollageSelectionCount(6.5)).toBe(false);
  });

  it('uses 2×2 for four styles and 2×3 for five or six in grid mode', () => {
    expect(styleCollageGridForCount(4)).toMatchObject({ cols: 2, rows: 2, cellCount: 4 });
    expect(styleCollageGridForCount(5)).toMatchObject({ cols: 2, rows: 3, cellCount: 6 });
    expect(styleCollageGridForCount(6)).toMatchObject({ cols: 2, rows: 3, cellCount: 6 });
  });

  it('lays out banner as one wide row and story as a tall column', () => {
    expect(styleCollageGridForCount(4, 'banner')).toEqual({
      cols: 4,
      rows: 1,
      cellCount: 4,
      mode: 'banner',
    });
    expect(styleCollageGridForCount(5, 'story')).toEqual({
      cols: 1,
      rows: 5,
      cellCount: 5,
      mode: 'story',
    });
    const banner = computeStyleCollageLayout({ count: 4, mode: 'banner' });
    expect(banner.canvasWidth).toBeGreaterThan(banner.canvasHeight);
    const story = computeStyleCollageLayout({ count: 4, mode: 'story' });
    expect(story.canvasHeight).toBeGreaterThan(story.canvasWidth);
  });

  it('can hide label strip height', () => {
    const withLabels = computeStyleCollageLayout({ count: 4, showLabels: true });
    const noLabels = computeStyleCollageLayout({ count: 4, showLabels: false });
    expect(noLabels.canvasHeight).toBeLessThan(withLabels.canvasHeight);
    expect(noLabels.cells[0]?.labelHeight).toBe(0);
  });

  it('computes non-overlapping cell rects inside the canvas', () => {
    const layout = computeStyleCollageLayout({ count: 4, cellWidth: 100, cellImageHeight: 80 });
    expect(layout.cells).toHaveLength(4);
    for (const cell of layout.cells) {
      expect(cell.x + cell.width).toBeLessThanOrEqual(layout.canvasWidth);
      expect(cell.y + cell.height).toBeLessThanOrEqual(layout.canvasHeight);
    }
  });
});
