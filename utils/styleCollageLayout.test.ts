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

  it('uses 2×2 for four styles and 2×3 for five or six', () => {
    expect(styleCollageGridForCount(4)).toEqual({ cols: 2, rows: 2, cellCount: 4 });
    expect(styleCollageGridForCount(5)).toEqual({ cols: 2, rows: 3, cellCount: 6 });
    expect(styleCollageGridForCount(6)).toEqual({ cols: 2, rows: 3, cellCount: 6 });
  });

  it('computes non-overlapping cell rects inside the canvas', () => {
    const layout = computeStyleCollageLayout({ count: 4, cellWidth: 100, cellImageHeight: 80 });
    expect(layout.cells).toHaveLength(4);
    expect(layout.canvasWidth).toBeGreaterThan(0);
    expect(layout.canvasHeight).toBeGreaterThan(0);
    for (const cell of layout.cells) {
      expect(cell.x + cell.width).toBeLessThanOrEqual(layout.canvasWidth);
      expect(cell.y + cell.height).toBeLessThanOrEqual(layout.canvasHeight);
      expect(cell.labelY).toBe(cell.y + cell.imageHeight);
    }
    // First two cells share a row; next two the second row.
    expect(layout.cells[0].y).toBe(layout.cells[1].y);
    expect(layout.cells[2].y).toBe(layout.cells[3].y);
    expect(layout.cells[2].y).toBeGreaterThan(layout.cells[0].y);
  });
});
