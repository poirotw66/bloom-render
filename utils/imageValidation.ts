/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side image validation before upload / API calls.
 */

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MIN_DIMENSION_PX = 512;
const LARGE_DIMENSION_PX = 4096;

const ACCEPTED_MIME_PREFIX = 'image/';

export interface ImageValidationInfo {
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

export interface ImageValidationResult {
  valid: boolean;
  /** i18n keys for blocking errors */
  errors: string[];
  /** i18n keys for non-blocking warnings */
  warnings: string[];
  info: ImageValidationInfo;
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('error.invalid_image'));
    };
    img.src = url;
  });
}

export async function validateImage(file: File): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: {
      width: 0,
      height: 0,
      size: file.size,
      mimeType: file.type,
    },
  };

  if (!file.type.startsWith(ACCEPTED_MIME_PREFIX)) {
    result.valid = false;
    result.errors.push('validation.error_not_image');
    return result;
  }

  if (file.size > MAX_FILE_BYTES) {
    result.valid = false;
    result.errors.push('validation.error_file_too_large');
    return result;
  }

  if (file.size === 0) {
    result.valid = false;
    result.errors.push('validation.error_file_empty');
    return result;
  }

  try {
    const { width, height } = await loadImageDimensions(file);
    result.info.width = width;
    result.info.height = height;

    if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
      result.warnings.push('validation.warn_resolution_low');
    }

    if (width > LARGE_DIMENSION_PX || height > LARGE_DIMENSION_PX) {
      result.warnings.push('validation.warn_will_compress');
    }
  } catch {
    result.valid = false;
    result.errors.push('validation.error_invalid_image');
  }

  return result;
}

/** First blocking error as translated string, or null if valid. */
export async function validateImageUploadMessage(
  file: File,
  t: (key: string) => string,
): Promise<string | null> {
  const result = await validateImage(file);
  if (!result.valid && result.errors.length > 0) {
    return t(result.errors[0]);
  }
  return null;
}
