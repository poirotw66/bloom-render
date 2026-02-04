/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { compressImage, CompressionOptions } from './imageCompressionWorker';

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

/**
 * Intelligently compress image if it exceeds size threshold.
 * Uses Web Worker to avoid blocking UI.
 * @param file Original image file
 * @param options Compression options
 * @param sizeThresholdMB Only compress if file size exceeds this threshold (in MB)
 * @returns Compressed File if compression was applied, original File otherwise
 */
export async function compressImageIfNeeded(
  file: File,
  options: CompressionOptions = {},
  sizeThresholdMB: number = 5
): Promise<File> {
  const sizeThresholdBytes = sizeThresholdMB * 1024 * 1024;
  
  // Only compress if file exceeds threshold
  if (file.size <= sizeThresholdBytes) {
    return file;
  }

  try {
    const compressed = await compressImage(file, options);
    console.log(
      `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressed.size / 1024 / 1024).toFixed(2)}MB`
    );
    return compressed;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}
