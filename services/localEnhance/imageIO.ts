/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Convert between app image sources (data URL / Blob) and canvas data URLs
 * without importing transformers.js (kept for unit tests / tree-shaking).
 */

/** Turn a Blob into a PNG data URL via FileReader (jsdom-friendly). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read blob as data URL'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/** Accept data URL, blob URL, or http(s) URL as pipeline input. */
export function isUsableImageSource(source: string): boolean {
  return (
    source.startsWith('data:') ||
    source.startsWith('blob:') ||
    source.startsWith('http://') ||
    source.startsWith('https://')
  );
}

/**
 * Draw an RGBA/RGB buffer onto a canvas and export as PNG data URL.
 * Used after RawImage inference without depending on RawImage.toBlob in tests.
 */
export function rgbaBufferToPngDataUrl(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  channels: number,
): string {
  if (width <= 0 || height <= 0) {
    throw new Error('Invalid image dimensions');
  }
  if (channels !== 3 && channels !== 4) {
    throw new Error(`Unsupported channel count: ${channels}`);
  }
  const expected = width * height * channels;
  if (data.length < expected) {
    throw new Error(`Buffer too small: ${data.length} < ${expected}`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const imageData = ctx.createImageData(width, height);
  const out = imageData.data;
  if (channels === 4) {
    out.set(data.subarray(0, expected));
  } else {
    for (let i = 0, j = 0; i < width * height; i += 1, j += 3) {
      const o = i * 4;
      out[o] = data[j]!;
      out[o + 1] = data[j + 1]!;
      out[o + 2] = data[j + 2]!;
      out[o + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
