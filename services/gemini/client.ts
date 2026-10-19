/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Lazy Gemini SDK client. Dynamic-imports `@google/genai` so the SDK chunk is
 * not modulepreloaded on the initial page.
 */

import { DEFAULT_MODEL } from '../../constants/models';
import { logger } from '../../utils/logger';
import { createI18nError, type ServiceSettings } from './shared';

/** Duck-typed response shape so shared helpers stay SDK-free. */
export interface GeminiGenerateContentResponse {
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        text?: string;
      }>;
    };
  }>;
  text?: string;
}

export async function loadGoogleGenAI(): Promise<typeof import('@google/genai').GoogleGenAI> {
  const mod = await import('@google/genai');
  return mod.GoogleGenAI;
}

export const getClient = async (settings?: ServiceSettings) => {
  const apiKey = settings?.apiKey || '';
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) {
    throw createI18nError('error.api_key_missing');
  }
  const GoogleGenAI = await loadGoogleGenAI();
  return new GoogleGenAI({ apiKey: key });
};

export const getModel = (settings?: ServiceSettings) => {
  return settings?.model || DEFAULT_MODEL;
};

/** Extract image data URL from a generateContent response; throws if blocked or no image. */
export const handleApiResponse = (
  response: GeminiGenerateContentResponse,
  context: string,
): string => {
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
