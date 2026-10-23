/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Layout math for multi-style collage grids (2×2 for 4 cells, 2×3 for 5–6).
 */

export const STYLE_COLLAGE_MIN = 4;
export const STYLE_COLLAGE_MAX = 6;

export type StyleCollageGrid = {
  cols: 2;
  rows: 2 | 3;
  cellCount: number;
};

export type StyleCollageCellRect = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  labelY: number;
  labelHeight: number;
  imageHeight: number;
};

export type StyleCollageLayout = {
  grid: StyleCollageGrid;
  canvasWidth: number;
  canvasHeight: number;
  padding: number;
  gap: number;
  cells: StyleCollageCellRect[];
};

/** Validate and clamp how many styles may be selected for a collage. */
export function clampStyleCollageSelectionCount(count: number): number {
  if (!Number.isFinite(count) || count < STYLE_COLLAGE_MIN) return STYLE_COLLAGE_MIN;
  if (count > STYLE_COLLAGE_MAX) return STYLE_COLLAGE_MAX;
  return Math.floor(count);
}

export function isValidStyleCollageSelectionCount(count: number): boolean {
  return Number.isInteger(count) && count >= STYLE_COLLAGE_MIN && count <= STYLE_COLLAGE_MAX;
}

/** 4 → 2×2; 5–6 → 2×3 (last cells may be empty at paint time). */
export function styleCollageGridForCount(count: number): StyleCollageGrid {
  const cellCount = clampStyleCollageSelectionCount(count);
  if (cellCount <= 4) return { cols: 2, rows: 2, cellCount: 4 };
  return { cols: 2, rows: 3, cellCount: 6 };
}

export function computeStyleCollageLayout(options: {
  count: number;
  cellWidth?: number;
  cellImageHeight?: number;
  labelHeight?: number;
  padding?: number;
  gap?: number;
}): StyleCollageLayout {
  const grid = styleCollageGridForCount(options.count);
  const cellWidth = options.cellWidth ?? 480;
  const imageHeight = options.cellImageHeight ?? 480;
  const labelHeight = options.labelHeight ?? 44;
  const padding = options.padding ?? 24;
  const gap = options.gap ?? 16;
  const cellHeight = imageHeight + labelHeight;

  const canvasWidth = padding * 2 + grid.cols * cellWidth + (grid.cols - 1) * gap;
  const canvasHeight = padding * 2 + grid.rows * cellHeight + (grid.rows - 1) * gap;

  const cells: StyleCollageCellRect[] = [];
  for (let i = 0; i < grid.cellCount; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);
    const x = padding + col * (cellWidth + gap);
    const y = padding + row * (cellHeight + gap);
    cells.push({
      index: i,
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      labelY: y + imageHeight,
      labelHeight,
      imageHeight,
    });
  }

  return { grid, canvasWidth, canvasHeight, padding, gap, cells };
}
