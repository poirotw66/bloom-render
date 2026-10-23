/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Compose generated style tiles into one labeled collage PNG (data URL).
 */

import { computeStyleCollageLayout } from './styleCollageLayout';

export type StyleCollageTile = {
  /** Image data URL or blob URL; null/undefined leaves an empty placeholder cell. */
  imageUrl?: string | null;
  label: string;
};

export type ComposeStyleCollageOptions = {
  tiles: StyleCollageTile[];
  /** CSS color for canvas background (theme bg). */
  background?: string;
  /** CSS color for label text. */
  labelColor?: string;
  /** CSS color for empty cell fill. */
  emptyFill?: string;
  cellWidth?: number;
  cellImageHeight?: number;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load collage tile'));
    img.src = url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Paint a 2×2 or 2×3 collage with labels under each tile. Returns a PNG data URL.
 */
export async function composeStyleCollage(options: ComposeStyleCollageOptions): Promise<string> {
  const tiles = options.tiles;
  const layout = computeStyleCollageLayout({
    count: Math.max(tiles.length, 4),
    cellWidth: options.cellWidth,
    cellImageHeight: options.cellImageHeight,
  });

  const canvas = document.createElement('canvas');
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = options.background ?? '#1a1216';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const labelColor = options.labelColor ?? '#f5f0f2';
  const emptyFill = options.emptyFill ?? 'rgba(255,255,255,0.06)';

  for (const cell of layout.cells) {
    const tile = tiles[cell.index];
    ctx.fillStyle = emptyFill;
    ctx.fillRect(cell.x, cell.y, cell.width, cell.imageHeight);

    if (tile?.imageUrl) {
      try {
        const img = await loadImage(tile.imageUrl);
        drawCover(ctx, img, cell.x, cell.y, cell.width, cell.imageHeight);
      } catch {
        // leave empty fill
      }
    }

    const label = tile?.label?.trim() || '';
    if (label) {
      ctx.fillStyle = labelColor;
      ctx.font = '600 22px "Work Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxWidth = cell.width - 16;
      let text = label;
      while (ctx.measureText(text).width > maxWidth && text.length > 1) {
        text = `${text.slice(0, -2)}…`;
      }
      ctx.fillText(text, cell.x + cell.width / 2, cell.labelY + cell.labelHeight / 2, maxWidth);
    }
  }

  return canvas.toDataURL('image/png');
}
