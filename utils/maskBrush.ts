/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Pure helpers for the editor retouch mask brush: stroke geometry, binary mask
 * export (white = edit, black = keep), and a tinted overlay used when the
 * selected image provider has no native mask parameter.
 */

export type MaskBrushTool = 'paint' | 'erase';

export interface MaskPoint {
  x: number;
  y: number;
}

export interface MaskStroke {
  tool: MaskBrushTool;
  /** Brush diameter in image pixels. */
  size: number;
  points: MaskPoint[];
}

export const MIN_BRUSH_SIZE = 8;
export const MAX_BRUSH_SIZE = 128;
export const DEFAULT_BRUSH_SIZE = 36;

/** Soft UI tint drawn over painted regions (not sent to the API). */
export const MASK_PREVIEW_FILL = 'rgba(56, 189, 248, 0.45)';

function clampBrushSize(size: number): number {
  return Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, Math.round(size)));
}

/**
 * Draw one stroke onto a 2d context. Paint uses source-over; erase uses
 * destination-out so prior paint in that region is cleared.
 */
export function drawMaskStroke(
  ctx: CanvasRenderingContext2D,
  stroke: MaskStroke,
  options?: { fillStyle?: string },
): void {
  if (stroke.points.length === 0) return;

  const fill = options?.fillStyle ?? '#ffffff';
  const radius = clampBrushSize(stroke.size) / 2;

  ctx.save();
  if (stroke.tool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fill;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const stamp = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  if (stroke.points.length === 1) {
    stamp(stroke.points[0]!.x, stroke.points[0]!.y);
  } else {
    // Dense stamps along each segment so fast pointer moves stay continuous.
    for (let i = 1; i < stroke.points.length; i += 1) {
      const a = stroke.points[i - 1]!;
      const b = stroke.points[i]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.max(1, radius * 0.35);
      const count = Math.max(1, Math.ceil(dist / step));
      for (let s = 0; s <= count; s += 1) {
        const t = s / count;
        stamp(a.x + dx * t, a.y + dy * t);
      }
    }
  }
  ctx.restore();
}

/** Redraw every stroke onto a cleared canvas (natural image size). */
export function renderMaskStrokes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: readonly MaskStroke[],
  options?: { fillStyle?: string; clear?: boolean },
): void {
  if (options?.clear !== false) {
    ctx.clearRect(0, 0, width, height);
  }
  for (const stroke of strokes) {
    drawMaskStroke(ctx, stroke, { fillStyle: options?.fillStyle });
  }
}

/** True when any non-transparent pixel remains (after paint minus erase). */
export function maskHasPaint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean {
  if (width <= 0 || height <= 0) return false;
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 0) > 0) return true;
  }
  return false;
}

/**
 * Export a binary mask PNG: white where painted, black elsewhere.
 * Alpha from the preview canvas is treated as coverage.
 */
export async function exportBinaryMaskFile(
  previewCanvas: HTMLCanvasElement,
  fileName = `edit-mask-${Date.now()}.png`,
): Promise<File> {
  const width = previewCanvas.width;
  const height = previewCanvas.height;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const src = previewCanvas.getContext('2d');
  if (!src) throw new Error('Canvas 2D unavailable');
  const image = src.getImageData(0, 0, width, height);
  const dest = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    const alpha = image.data[i + 3] ?? 0;
    if (alpha > 0) {
      dest.data[i] = 255;
      dest.data[i + 1] = 255;
      dest.data[i + 2] = 255;
      dest.data[i + 3] = 255;
    }
  }
  ctx.putImageData(dest, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode mask PNG'))),
      'image/png',
    );
  });
  return new File([blob], fileName, { type: 'image/png' });
}

function loadImageElement(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for mask overlay'));
    img.src = source;
  });
}

async function fileToObjectUrl(file: File): Promise<string> {
  return URL.createObjectURL(file);
}

/**
 * Composite the original photo with a translucent tint where the binary mask
 * is white. Used when the provider has no native mask parameter — the model
 * sees the highlighted regions and the prompt describes them.
 */
export async function composeMaskOverlayImage(
  originalImage: File,
  binaryMask: File,
  options?: { tint?: string; fileName?: string },
): Promise<File> {
  const tint = options?.tint ?? 'rgba(236, 72, 153, 0.45)';
  const originalUrl = await fileToObjectUrl(originalImage);
  const maskUrl = await fileToObjectUrl(binaryMask);
  try {
    const [original, mask] = await Promise.all([
      loadImageElement(originalUrl),
      loadImageElement(maskUrl),
    ]);
    const width = original.naturalWidth || original.width;
    const height = original.naturalHeight || original.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');

    ctx.drawImage(original, 0, 0, width, height);

    // Build an alpha mask from the binary mask's luminance, then fill tint.
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Canvas 2D unavailable');
    maskCtx.drawImage(mask, 0, 0, width, height);
    const maskData = maskCtx.getImageData(0, 0, width, height);
    const tintCanvas = document.createElement('canvas');
    tintCanvas.width = width;
    tintCanvas.height = height;
    const tintCtx = tintCanvas.getContext('2d');
    if (!tintCtx) throw new Error('Canvas 2D unavailable');
    tintCtx.fillStyle = tint;
    tintCtx.fillRect(0, 0, width, height);
    const tintData = tintCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      const lum =
        ((maskData.data[i] ?? 0) + (maskData.data[i + 1] ?? 0) + (maskData.data[i + 2] ?? 0)) / 3;
      tintData.data[i + 3] = Math.round(((tintData.data[i + 3] ?? 0) * lum) / 255);
    }
    tintCtx.putImageData(tintData, 0, 0);
    ctx.drawImage(tintCanvas, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode overlay PNG'))),
        'image/png',
      );
    });
    return new File([blob], options?.fileName ?? `edit-overlay-${Date.now()}.png`, {
      type: 'image/png',
    });
  } finally {
    URL.revokeObjectURL(originalUrl);
    URL.revokeObjectURL(maskUrl);
  }
}

/**
 * Map a pointer position from display CSS pixels into natural image pixels.
 */
export function displayToNaturalPoint(
  clientX: number,
  clientY: number,
  rect: DOMRectReadOnly,
  naturalWidth: number,
  naturalHeight: number,
): MaskPoint {
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * naturalWidth;
  const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * naturalHeight;
  return {
    x: Math.min(naturalWidth, Math.max(0, x)),
    y: Math.min(naturalHeight, Math.max(0, y)),
  };
}
