/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { compressImage, CompressionOptions } from './imageCompressionWorker';
import { logger } from './logger';

/**
 * Converts a data URL string to a File object.
 */
export function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error('Could not parse MIME type from data URL');

  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const DEFAULT_MAX_EDGE = 2048;

/**
 * True when the image's long edge exceeds `maxEdge`. Falls back to `false`
 * when the runtime cannot decode dimensions (tests / missing APIs) so callers
 * can still apply a byte-size threshold.
 */
export async function imageExceedsMaxEdge(
  file: File,
  maxEdge: number = DEFAULT_MAX_EDGE,
): Promise<boolean> {
  if (typeof createImageBitmap !== 'function') return false;
  try {
    const bitmap = await createImageBitmap(file);
    const exceeds = Math.max(bitmap.width, bitmap.height) > maxEdge;
    bitmap.close();
    return exceeds;
  } catch {
    return false;
  }
}

/**
 * Downscale / compress before API upload when the long edge exceeds the max
 * dimension (default 2048) **or** the file exceeds the byte-size threshold.
 * Uses a Web Worker so the UI stays responsive.
 */
export async function compressImageIfNeeded(
  file: File,
  options: CompressionOptions = {},
  sizeThresholdMB: number = 5,
): Promise<File> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_EDGE;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_EDGE;
  const maxEdge = Math.max(maxWidth, maxHeight);
  const sizeThresholdBytes = sizeThresholdMB * 1024 * 1024;
  const oversizeBytes = file.size > sizeThresholdBytes;
  const oversizePixels = await imageExceedsMaxEdge(file, maxEdge);

  if (!oversizeBytes && !oversizePixels) {
    return file;
  }

  try {
    const compressed = await compressImage(file, {
      maxWidth,
      maxHeight,
      quality: options.quality ?? 0.85,
      mimeType: options.mimeType,
    });
    logger.debug(
      `Image prepared for upload: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressed.size / 1024 / 1024).toFixed(2)}MB`,
    );
    return compressed;
  } catch (error) {
    logger.warn('Image compression failed, using original:', error);
    return file;
  }
}
