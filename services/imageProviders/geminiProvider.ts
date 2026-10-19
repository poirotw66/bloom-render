/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Gemini image path via @google/genai generateContent.
 * The SDK is loaded with `await import('@google/genai')` so it is not
 * modulepreloaded on the initial page.
 */

import { handleApiResponse, loadGoogleGenAI } from '../gemini/client';
import { createI18nError } from '../gemini/shared';
import { withRetryAndTimeout } from '../retry';
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
    await withRetryAndTimeout(
      async (combined) => {
        const GoogleGenAI = await loadGoogleGenAI();
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        const listPromise = ai.models.list();
        await Promise.race([
          listPromise,
          new Promise<never>((_, reject) => {
            if (combined.aborted) {
              reject(new DOMException('Aborted', 'AbortError'));
              return;
            }
            combined.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true },
            );
          }),
        ]);
      },
      { signal },
    );
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

    const parts: ContentPart[] = [
      ...images.map((img) => ({
        inlineData: { mimeType: img.mimeType || 'image/png', data: img.data },
      })),
      { text: prompt },
    ];

    try {
      return await withRetryAndTimeout(
        async (combined) => {
          const GoogleGenAI = await loadGoogleGenAI();
          const ai = new GoogleGenAI({ apiKey: key });

          const config: {
            abortSignal?: AbortSignal;
            responseModalities?: Array<'TEXT' | 'IMAGE'>;
            imageConfig?: { aspectRatio?: string; imageSize?: string };
          } = {
            abortSignal: combined,
          };

          if (includeImageConfig) {
            config.responseModalities = ['TEXT', 'IMAGE'];
            config.imageConfig = {};
            if (aspectRatio) config.imageConfig.aspectRatio = aspectRatio;
            if (imageSize) config.imageConfig.imageSize = imageSize;
          }

          const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config,
          });
          return handleApiResponse(response, 'generation');
        },
        { signal },
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof Error && err.message.startsWith('error.')) throw err;
      throw toProviderI18nError('gemini', err);
    }
  },
};
