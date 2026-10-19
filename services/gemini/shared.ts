/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared helpers and types for Gemini-based image services.
 * Intentionally SDK-free so UI imports do not pull `@google/genai` into the
 * initial bundle (see services/gemini/client.ts for lazy SDK access).
 */

import { compressImageIfNeeded } from '../../utils/fileUtils';
import { logger } from '../../utils/logger';
import { modelSupportsMultiResolution, type ImageProviderId } from '../imageProviders';

export { DEFAULT_MODEL, MODELS_SUPPORTING_MULTI_RESOLUTION } from '../../constants/models';

/** Provider-aware multi-resolution check (Gemini + OpenRouter model ids). */
export function supportsMultiResolution(model?: string): boolean {
  return modelSupportsMultiResolution(model);
}

export interface ServiceSettings {
  apiKey?: string;
  model?: string;
  /** Defaults to gemini when omitted (backward compatible). */
  provider?: ImageProviderId;
  /**
   * Cancels the client's wait for the response. Note the SDK's caveat: this is
   * client-side only, so the request is not stopped server-side and usage is
   * still billed. It frees the user from waiting, not from the charge.
   */
  abortSignal?: AbortSignal;
}

export enum ApiErrorType {
  BLOCKED = 'blocked',
  SAFETY_FILTER = 'safety_filter',
  NO_IMAGE = 'no_image',
  NETWORK_ERROR = 'network_error',
  API_KEY_MISSING = 'api_key_missing',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_REQUEST = 'invalid_request',
  UNKNOWN = 'unknown',
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  originalError?: Error;
}

/** i18n key prefix for thrown app errors (pass-through to UI). */
export const I18N_ERROR_PREFIX = 'error.';

export const I18N_ERROR_KEY_UNKNOWN = `${I18N_ERROR_PREFIX}unknown`;

export function isI18nErrorKey(message: string): boolean {
  return message.startsWith(I18N_ERROR_PREFIX);
}

/** Throw an Error whose message is an i18n key for UI translation. */
export function createI18nError(key: string): Error {
  if (!isI18nErrorKey(key)) {
    throw new Error(`createI18nError expects key starting with "${I18N_ERROR_PREFIX}"`);
  }
  return new Error(key);
}

export function getI18nErrorKey(error: unknown, context: string = 'generation'): string {
  return normalizeApiError(error, context).message;
}

/** Map API/transport errors to a translated user-visible string. */
export function formatApiErrorMessage(
  error: unknown,
  t: (key: string) => string,
  context: string = 'generation',
): string {
  return t(getI18nErrorKey(error, context));
}

/**
 * Convert API errors to user-friendly error messages with i18n keys.
 * If error.message is already an i18n key (starts with "error."), it is passed through.
 */
export const normalizeApiError = (error: unknown, _context: string = 'generation'): ApiError => {
  if (error instanceof Error && error.message.startsWith(I18N_ERROR_PREFIX)) {
    return {
      type: ApiErrorType.UNKNOWN,
      message: error.message,
      originalError: error,
    };
  }
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // API Key missing / invalid (Gemini or OpenRouter)
    if (
      errorMessage.includes('api key') ||
      errorMessage.includes('api_key') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401')
    ) {
      const openRouter =
        errorMessage.includes('openrouter') || error.message.startsWith('error.openrouter');
      return {
        type: ApiErrorType.API_KEY_MISSING,
        message: openRouter ? 'error.openrouter_invalid_key' : 'error.api_key_missing',
        originalError: error,
      };
    }

    // Request blocked
    if (errorMessage.includes('blocked') || errorMessage.includes('blockreason')) {
      return {
        type: ApiErrorType.BLOCKED,
        message: `error.blocked`,
        originalError: error,
      };
    }

    // Safety filter
    if (
      errorMessage.includes('safety') ||
      errorMessage.includes('finishreason') ||
      errorMessage.includes('stopped unexpectedly')
    ) {
      return {
        type: ApiErrorType.SAFETY_FILTER,
        message: `error.safety_filter`,
        originalError: error,
      };
    }

    // No image returned
    if (errorMessage.includes('no image') || errorMessage.includes('did not return an image')) {
      return {
        type: ApiErrorType.NO_IMAGE,
        message: `error.no_image`,
        originalError: error,
      };
    }

    // Quota / rate limit (Gemini or OpenRouter)
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429') ||
      errorMessage.includes('503')
    ) {
      const openRouter = errorMessage.includes('openrouter');
      return {
        type: ApiErrorType.QUOTA_EXCEEDED,
        message: openRouter ? 'error.openrouter_rate_limit' : 'error.quota_exceeded',
        originalError: error,
      };
    }

    // Network error
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout')
    ) {
      return {
        type: ApiErrorType.NETWORK_ERROR,
        message: `error.network_error`,
        originalError: error,
      };
    }

    // Invalid request
    if (errorMessage.includes('invalid') || errorMessage.includes('bad request')) {
      return {
        type: ApiErrorType.INVALID_REQUEST,
        message: `error.invalid_request`,
        originalError: error,
      };
    }
  }

  // Unknown error — optional feature-specific fallback key via context
  const contextFallbackKeys: Record<string, string> = {
    idphoto: 'idphoto.error_generation_failed',
    portrait: 'portrait.error_generation_failed',
    themed: 'themed.error_generation_failed',
    travel: 'travel.error_generation_failed',
    tryon: 'tryon.error_generation_failed',
    couple_group: 'couple_group.error_generation_failed',
    edit: 'main.error_failed_gen',
    filter: 'main.error_failed_filter',
    adjustment: 'main.error_failed_adjust',
    generation: 'start.error_gen_failed',
  };
  const fallbackKey = contextFallbackKeys[_context] ?? I18N_ERROR_KEY_UNKNOWN;

  return {
    type: ApiErrorType.UNKNOWN,
    message: fallbackKey,
    originalError: error instanceof Error ? error : new Error(String(error)),
  };
};

/** Convert a File to a Gemini API inlineData part. */
export const fileToPart = async (
  file: File,
  compressIfNeeded?: (file: File) => Promise<File>,
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  // Apply compression if provided
  const finalFile = compressIfNeeded ? await compressIfNeeded(file) : file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(finalFile);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

  const arr = dataUrl.split(',');
  if (arr.length < 2) throw createI18nError('error.invalid_request');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw createI18nError('error.invalid_request');

  const mimeType = mimeMatch[1];
  const data = arr[1];
  return { inlineData: { mimeType, data } };
};

/**
 * Get compression function based on settings stored in localStorage.
 * Returns a function that compresses images if enabled, or identity function if disabled.
 */
export const getCompressionFunction = (): ((file: File) => Promise<File>) => {
  // Check settings from localStorage (non-React way to access settings)
  const compressionEnabled = localStorage.getItem('pixshop_compression_enabled') !== 'false'; // Default to true
  const thresholdStr = localStorage.getItem('pixshop_compression_threshold') || '5';
  const thresholdMB = parseFloat(thresholdStr) || 5;

  if (!compressionEnabled) {
    // Return identity function (no compression)
    return async (file: File) => file;
  }

  return async (file: File) => {
    try {
      // Always downscale when the long edge exceeds 2048; the byte threshold
      // only covers already-small-dimension but heavy files.
      return await compressImageIfNeeded(
        file,
        { maxWidth: 2048, maxHeight: 2048, quality: 0.85 },
        thresholdMB,
      );
    } catch (error) {
      logger.warn('Failed to compress image, using original:', error);
      return file;
    }
  };
};

/**
 * Convert a File to a Gemini API inlineData part with automatic compression.
 * This is a convenience wrapper that automatically applies compression based on settings.
 */
export const fileToPartAuto = async (
  file: File,
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const compressFn = getCompressionFunction();
  return fileToPart(file, compressFn);
};
