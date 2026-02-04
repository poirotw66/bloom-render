/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared helpers and types for Gemini-based image services.
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

export interface ServiceSettings {
  apiKey?: string;
  model?: string;
}

/** Convert a File to a Gemini API inlineData part. */
export const fileToPart = async (
  file: File
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
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

/** Extract image data URL from GenerateContentResponse; throws if blocked or no image. */
export const handleApiResponse = (
  response: GenerateContentResponse,
  context: string
): string => {
  if (response.promptFeedback?.blockReason) {
    const { blockReason, blockReasonMessage } = response.promptFeedback;
    const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
    console.error(errorMessage, { response });
    throw new Error(errorMessage);
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
    throw new Error(errorMessage);
  }

  const textFeedback = response.text?.trim();
  const errorMessage =
    `The AI model did not return an image for the ${context}. ` +
    (textFeedback
      ? `The model responded with text: "${textFeedback}"`
      : 'This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.');

  console.error(`Model response did not contain an image part for ${context}.`, { response });
  throw new Error(errorMessage);
};

export const getClient = (settings?: ServiceSettings) => {
  const apiKey = settings?.apiKey || process.env.API_KEY!;
  if (!apiKey) throw new Error('API Key not found. Please check your settings.');
  return new GoogleGenAI({ apiKey });
};

export const getModel = (settings?: ServiceSettings) => {
  return settings?.model || 'gemini-2.5-flash-image';
};