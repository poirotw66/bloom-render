/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Convert image sources to downloadable blobs in PNG / JPEG / WebP.
 */

export type ImageExportFormat = 'png' | 'jpeg' | 'webp';

export const IMAGE_EXPORT_MIME: Record<ImageExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export const IMAGE_EXPORT_EXTENSION: Record<ImageExportFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
};

export function extensionForFormat(format: ImageExportFormat): string {
  return IMAGE_EXPORT_EXTENSION[format];
}

export function withExtension(fileName: string, format: ImageExportFormat): string {
  const base = fileName.replace(/\.[a-z0-9]+$/i, '');
  return `${base}.${extensionForFormat(format)}`;
}

async function loadImageElement(source: string | Blob): Promise<HTMLImageElement> {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image for export'));
      el.src = url;
    });
    return img;
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

/**
 * Rasterize `source` to a Blob in the requested format.
 * Quality applies to jpeg/webp (0–1); ignored for png.
 */
export async function exportImageBlob(
  source: string | Blob,
  format: ImageExportFormat = 'png',
  quality: number = 0.92,
): Promise<Blob> {
  if (format === 'png' && source instanceof Blob && source.type === 'image/png') {
    return source;
  }

  const img = await loadImageElement(source);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  const mime = IMAGE_EXPORT_MIME[format];
  const q = format === 'png' ? undefined : Math.min(1, Math.max(0.1, quality));

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Export failed'))),
      mime,
      q,
    );
  });
  return blob;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadImageAs(
  source: string | Blob,
  fileName: string,
  format: ImageExportFormat = 'png',
  quality: number = 0.92,
): Promise<void> {
  const blob = await exportImageBlob(source, format, quality);
  triggerBlobDownload(blob, withExtension(fileName, format));
}
