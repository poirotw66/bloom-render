/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Compose generated style tiles into one labeled collage (PNG or JPEG data URL).
 */

import { computeStyleCollageLayout, type StyleCollageLayoutMode } from './styleCollageLayout';

export type StyleCollageTile = {
  imageUrl?: string | null;
  label: string;
};

export type ComposeStyleCollageOptions = {
  tiles: StyleCollageTile[];
  mode?: StyleCollageLayoutMode;
  showLabels?: boolean;
  showBorder?: boolean;
  gap?: number;
  /** CSS color for canvas background (theme bg). */
  background?: string;
  labelColor?: string;
  emptyFill?: string;
  borderColor?: string;
  format?: 'png' | 'jpeg';
  jpegQuality?: number;
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
 * Paint collage cells with optional labels/borders. Returns a data URL.
 */
export async function composeStyleCollage(options: ComposeStyleCollageOptions): Promise<string> {
  const tiles = options.tiles;
  const layout = computeStyleCollageLayout({
    count: Math.max(tiles.length, 4),
    mode: options.mode ?? 'grid',
    showLabels: options.showLabels !== false,
    gap: options.gap,
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
  const borderColor = options.borderColor ?? 'rgba(255,255,255,0.28)';
  const showBorder = options.showBorder === true;
  const showLabels = options.showLabels !== false;

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

    if (showBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(cell.x + 1, cell.y + 1, cell.width - 2, cell.imageHeight - 2);
    }

    const label = tile?.label?.trim() || '';
    if (showLabels && label && cell.labelHeight > 0) {
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

  const format = options.format ?? 'png';
  if (format === 'jpeg') {
    return canvas.toDataURL('image/jpeg', options.jpegQuality ?? 0.92);
  }
  return canvas.toDataURL('image/png');
}
