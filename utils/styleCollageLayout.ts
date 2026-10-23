/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Layout math for multi-style collage: grid, wide banner, or story strip.
 */

export const STYLE_COLLAGE_MIN = 4;
export const STYLE_COLLAGE_MAX = 6;

export type StyleCollageLayoutMode = 'grid' | 'banner' | 'story';

export type StyleCollageGrid = {
  cols: number;
  rows: number;
  cellCount: number;
  mode: StyleCollageLayoutMode;
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

export type StyleCollageLayoutOptions = {
  count: number;
  mode?: StyleCollageLayoutMode;
  showLabels?: boolean;
  cellWidth?: number;
  cellImageHeight?: number;
  labelHeight?: number;
  padding?: number;
  gap?: number;
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

/** 4 → 2×2; 5–6 → 2×3 for grid mode. */
export function styleCollageGridForCount(
  count: number,
  mode: StyleCollageLayoutMode = 'grid',
): StyleCollageGrid {
  const n = clampStyleCollageSelectionCount(count);
  if (mode === 'banner') return { cols: n, rows: 1, cellCount: n, mode };
  if (mode === 'story') return { cols: 1, rows: n, cellCount: n, mode };
  if (n <= 4) return { cols: 2, rows: 2, cellCount: 4, mode: 'grid' };
  return { cols: 2, rows: 3, cellCount: 6, mode: 'grid' };
}

export function computeStyleCollageLayout(options: StyleCollageLayoutOptions): StyleCollageLayout {
  const mode = options.mode ?? 'grid';
  const grid = styleCollageGridForCount(options.count, mode);
  const showLabels = options.showLabels !== false;
  const labelHeight = showLabels ? (options.labelHeight ?? 44) : 0;
  const padding = options.padding ?? 24;
  const gap = options.gap ?? 16;

  let cellWidth = options.cellWidth ?? 480;
  let imageHeight = options.cellImageHeight ?? 480;

  if (mode === 'banner') {
    cellWidth = options.cellWidth ?? 360;
    imageHeight = options.cellImageHeight ?? 240; // wide tiles → ~3–4:1 overall
  } else if (mode === 'story') {
    cellWidth = options.cellWidth ?? 540;
    imageHeight = options.cellImageHeight ?? 360;
  }

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
