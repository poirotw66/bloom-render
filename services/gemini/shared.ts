/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared helpers and types for Gemini-based image services.
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { compressImageIfNeeded } from '../../utils/fileUtils';
import { logger } from '../../utils/logger';

export interface ServiceSettings {
  apiKey?: string;
  model?: string;
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

    // API Key missing
    if (errorMessage.includes('api key') || errorMessage.includes('api_key')) {
      return {
        type: ApiErrorType.API_KEY_MISSING,
        message: `error.api_key_missing`,
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

    // Quota exceeded
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return {
        type: ApiErrorType.QUOTA_EXCEEDED,
        message: `error.quota_exceeded`,
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

/** Extract image data URL from GenerateContentResponse; throws if blocked or no image. */
export const handleApiResponse = (response: GenerateContentResponse, context: string): string => {
  if (response.promptFeedback?.blockReason) {
    const { blockReason, blockReasonMessage } = response.promptFeedback;
    logger.error('Request blocked by API', { blockReason, blockReasonMessage, response });
    throw createI18nError('error.blocked');
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const withInline = parts.filter((p) => p.inlineData);
  const imagePartFromResponse =
    context === 'generation' && withInline.length > 0
      ? withInline[withInline.length - 1]
      : parts.find((part) => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    logger.debug(`Received image data (${mimeType}) for ${context}`);
    return `data:${mimeType};base64,${data}`;
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    logger.error('Image generation stopped unexpectedly', { context, finishReason, response });
    throw createI18nError('error.safety_filter');
  }

  const textFeedback = response.text?.trim();
  logger.error('Model response did not contain an image part', {
    context,
    textFeedback,
    response,
  });
  throw createI18nError('error.no_image');
};

export const getClient = (settings?: ServiceSettings) => {
  const apiKey = settings?.apiKey || '';
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) {
    throw createI18nError('error.api_key_missing');
  }
  return new GoogleGenAI({ apiKey: key });
};

/** Model IDs that support multiple output resolutions (e.g. 1K, 2K, 4K). */
export const MODELS_SUPPORTING_MULTI_RESOLUTION = [
  'gemini-3-pro-image-preview',
  'gemini-3.1-flash-image-preview',
] as const;

export const supportsMultiResolution = (model?: string): boolean =>
  !!model &&
  MODELS_SUPPORTING_MULTI_RESOLUTION.includes(
    model as (typeof MODELS_SUPPORTING_MULTI_RESOLUTION)[number],
  );

export const getModel = (settings?: ServiceSettings) => {
  return settings?.model || 'gemini-2.5-flash-image';
};
