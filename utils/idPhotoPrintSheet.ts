/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Layout multiple ID photos onto a 4×6" sheet with cut guides; export JPG + PDF.
 */

import {
  ID_PHOTO_PRINT_DPI,
  printSheetPixelSize,
  type IdPhotoSizePreset,
  presetPixelSize,
} from '../constants/idPhotoSizes';
import { jpegBytesToSinglePagePdf } from './jpegPdf';

export interface PrintSheetLayout {
  cols: number;
  rows: number;
  count: number;
  margin: number;
  gap: number;
  photoW: number;
  photoH: number;
  sheetW: number;
  sheetH: number;
  offsetX: number;
  offsetY: number;
}

/** How many copies of `photoW×photoH` fit on the sheet with margins/gaps. */
export function computePrintSheetLayout(
  photoW: number,
  photoH: number,
  sheetW: number = printSheetPixelSize().width,
  sheetH: number = printSheetPixelSize().height,
  margin: number = Math.round(ID_PHOTO_PRINT_DPI * 0.15),
  gap: number = Math.round(ID_PHOTO_PRINT_DPI * 0.08),
): PrintSheetLayout {
  const cols = Math.max(1, Math.floor((sheetW - 2 * margin + gap) / (photoW + gap)));
  const rows = Math.max(1, Math.floor((sheetH - 2 * margin + gap) / (photoH + gap)));
  const usedW = cols * photoW + (cols - 1) * gap;
  const usedH = rows * photoH + (rows - 1) * gap;
  return {
    cols,
    rows,
    count: cols * rows,
    margin,
    gap,
    photoW,
    photoH,
    sheetW,
    sheetH,
    offsetX: Math.round((sheetW - usedW) / 2),
    offsetY: Math.round((sheetH - usedH) / 2),
  };
}

export function layoutForPreset(preset: IdPhotoSizePreset): PrintSheetLayout {
  const { width, height } = presetPixelSize(preset);
  return computePrintSheetLayout(width, height);
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for print sheet'));
    img.src = source;
  });
}

function drawCutGuides(
  ctx: CanvasRenderingContext2D,
  layout: PrintSheetLayout,
  cellX: number,
  cellY: number,
): void {
  const { photoW, photoH } = layout;
  const mark = Math.max(8, Math.round(photoW * 0.04));
  ctx.save();
  ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
  ctx.lineWidth = Math.max(1, Math.round(photoW / 400));
  // Corner tick marks (cut guides).
  const corners: Array<[number, number, number, number, number, number]> = [
    [cellX, cellY, cellX + mark, cellY, cellX, cellY + mark],
    [cellX + photoW, cellY, cellX + photoW - mark, cellY, cellX + photoW, cellY + mark],
    [cellX, cellY + photoH, cellX + mark, cellY + photoH, cellX, cellY + photoH - mark],
    [
      cellX + photoW,
      cellY + photoH,
      cellX + photoW - mark,
      cellY + photoH,
      cellX + photoW,
      cellY + photoH - mark,
    ],
  ];
  for (const [x0, y0, x1, y1, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Render a 4×6" sheet canvas filled with as many copies as fit.
 */
export async function renderIdPhotoPrintSheet(
  photoSource: string,
  preset: IdPhotoSizePreset,
): Promise<{ canvas: HTMLCanvasElement; layout: PrintSheetLayout }> {
  const layout = layoutForPreset(preset);
  const img = await loadImage(photoSource);
  const canvas = document.createElement('canvas');
  canvas.width = layout.sheetW;
  canvas.height = layout.sheetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, layout.sheetW, layout.sheetH);

  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      const x = layout.offsetX + col * (layout.photoW + layout.gap);
      const y = layout.offsetY + row * (layout.photoH + layout.gap);
      ctx.drawImage(img, x, y, layout.photoW, layout.photoH);
      drawCutGuides(ctx, layout, x, y);
    }
  }

  return { canvas, layout };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode print sheet JPEG'));
        else resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

export async function exportIdPhotoPrintSheetJpg(
  photoSource: string,
  preset: IdPhotoSizePreset,
): Promise<Blob> {
  const { canvas } = await renderIdPhotoPrintSheet(photoSource, preset);
  return canvasToJpegBlob(canvas);
}

export async function exportIdPhotoPrintSheetPdf(
  photoSource: string,
  preset: IdPhotoSizePreset,
): Promise<Blob> {
  const { canvas } = await renderIdPhotoPrintSheet(photoSource, preset);
  const jpeg = await canvasToJpegBlob(canvas, 0.92);
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  const pdfBytes = jpegBytesToSinglePagePdf(bytes, canvas.width, canvas.height, ID_PHOTO_PRINT_DPI);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
