/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared helpers and types for Gemini-based image services.
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { compressImageIfNeeded } from '../../utils/fileUtils';

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

/**
 * Convert API errors to user-friendly error messages with i18n keys.
 */
export const normalizeApiError = (error: unknown, context: string = 'generation'): ApiError => {
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

  // Unknown error
  return {
    type: ApiErrorType.UNKNOWN,
    message: `error.unknown`,
    originalError: error instanceof Error ? error : new Error(String(error)),
  };
};

/** Convert a File to a Gemini API inlineData part. */
export const fileToPart = async (
  file: File,
  compressIfNeeded?: (file: File) => Promise<File>
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
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error('Could not parse MIME type from data URL');

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
      return await compressImageIfNeeded(file, { maxWidth: 2048, maxHeight: 2048, quality: 0.85 }, thresholdMB);
    } catch (error) {
      console.warn('Failed to compress image, using original:', error);
      return file;
    }
  };
};

/**
 * Convert a File to a Gemini API inlineData part with automatic compression.
 * This is a convenience wrapper that automatically applies compression based on settings.
 */
export const fileToPartAuto = async (
  file: File
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const compressFn = getCompressionFunction();
  return fileToPart(file, compressFn);
};

/** Extract image data URL from GenerateContentResponse; throws if blocked or no image. */
export const handleApiResponse = (
  response: GenerateContentResponse,
  context: string
): string => {
  if (response.promptFeedback?.blockReason) {
    const { blockReason, blockReasonMessage } = response.promptFeedback;
    const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
    console.error(errorMessage, { response });
    const error = new Error(errorMessage);
    error.name = 'BLOCKED';
    throw error;
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const withInline = parts.filter((p) => p.inlineData);
  const imagePartFromResponse =
    context === 'generation' && withInline.length > 0
      ? withInline[withInline.length - 1]
      : parts.find((part) => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received image data (${mimeType}) for ${context}`);
    return `data:${mimeType};base64,${data}`;
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
    console.error(errorMessage, { response });
    const error = new Error(errorMessage);
    error.name = 'SAFETY_FILTER';
    throw error;
  }

  const textFeedback = response.text?.trim();
  const errorMessage =
    `The AI model did not return an image for the ${context}. ` +
    (textFeedback
      ? `The model responded with text: "${textFeedback}"`
      : 'This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.');

  console.error(`Model response did not contain an image part for ${context}.`, { response });
  const error = new Error(errorMessage);
  error.name = 'NO_IMAGE';
  throw error;
};

export const getClient = (settings?: ServiceSettings) => {
  const apiKey = settings?.apiKey || process.env.API_KEY!;
  if (!apiKey) throw new Error('API Key not found. Please check your settings.');
  return new GoogleGenAI({ apiKey });
};

export const getModel = (settings?: ServiceSettings) => {
  return settings?.model || 'gemini-2.5-flash-image';
};