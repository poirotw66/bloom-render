import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { createI18nError, handleApiResponse } from '../gemini/shared';
import { toProviderI18nError } from './providerErrors';
import type { GenerateImageRequest, ImageProvider } from './types';

type ContentPart = { inlineData: { mimeType: string; data: string } } | { text: string };

/**
 * Gemini image path via @google/genai generateContent.
 * Preserves BloomRender's previous modalities / imageConfig behavior.
 */
export const geminiImageProvider: ImageProvider = {
  id: 'gemini',

  async validateApiKey(apiKey: string, signal?: AbortSignal): Promise<void> {
    if (!apiKey.trim()) {
      throw createI18nError('error.api_key_missing');
    }
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    await ai.models.list();
  },

  async generateImage(request: GenerateImageRequest): Promise<string> {
    const {
      prompt,
      images = [],
      model,
      apiKey,
      aspectRatio,
      imageSize,
      signal,
      includeImageConfig = true,
    } = request;

    const key = apiKey.trim();
    if (!key) {
      throw createI18nError('error.api_key_missing');
    }
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const parts: ContentPart[] = [
      ...images.map((img) => ({
        inlineData: { mimeType: img.mimeType || 'image/png', data: img.data },
      })),
      { text: prompt },
    ];

    const config: {
      abortSignal?: AbortSignal;
      responseModalities?: Array<'TEXT' | 'IMAGE'>;
      imageConfig?: { aspectRatio?: string; imageSize?: string };
    } = {
      abortSignal: signal,
    };

    if (includeImageConfig) {
      config.responseModalities = ['TEXT', 'IMAGE'];
      config.imageConfig = {};
      if (aspectRatio) config.imageConfig.aspectRatio = aspectRatio;
      if (imageSize) config.imageConfig.imageSize = imageSize;
    }

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: { parts },
        config,
      });
      return handleApiResponse(response, 'generation');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof Error && err.message.startsWith('error.')) throw err;
      throw toProviderI18nError('gemini', err);
    }
  },
};
