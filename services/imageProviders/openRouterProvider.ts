/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { createI18nError } from '../gemini/shared';
import { attachHttpMeta, withRetryAndTimeout } from '../retry';
import { toProviderI18nError } from './providerErrors';
import type { GenerateImageRequest, ImageProvider, ImagePart } from './types';

const OPENROUTER_IMAGES_URL = 'https://openrouter.ai/api/v1/images';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

function toDataUrl(part: ImagePart): string {
  const mime = part.mimeType || 'image/png';
  if (part.data.startsWith('data:')) return part.data;
  return `data:${mime};base64,${part.data}`;
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey.trim()}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://www.bloss0m.com/bloom-render/',
    'X-Title': 'BloomRender',
  };
}

interface OpenRouterImageData {
  b64_json?: string;
  media_type?: string;
  url?: string;
}

interface OpenRouterImagesResponse {
  data?: OpenRouterImageData[];
  error?: { message?: string; code?: string | number };
  usage?: {
    cost?: number;
    total_cost?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function readUsageCostUsd(json: OpenRouterImagesResponse): number | undefined {
  const raw = json.usage?.cost ?? json.usage?.total_cost;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  return undefined;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    return body.error?.message || body.message || response.statusText;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

function throwHttpError(response: Response, detail: string): never {
  throw attachHttpMeta(
    new Error(`OpenRouter ${response.status}: ${detail}`),
    response.status,
    response.headers.get('Retry-After'),
  );
}

/**
 * OpenRouter BYOK image generation via POST /api/v1/images.
 */
export const openRouterImageProvider: ImageProvider = {
  id: 'openrouter',

  async validateApiKey(apiKey: string, signal?: AbortSignal): Promise<void> {
    if (!apiKey.trim()) {
      throw createI18nError('error.openrouter_invalid_key');
    }
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    try {
      await withRetryAndTimeout(
        async (combined) => {
          const response = await fetch(`${OPENROUTER_MODELS_URL}?limit=1`, {
            method: 'GET',
            headers: authHeaders(apiKey),
            signal: combined,
          });
          if (!response.ok) {
            const detail = await parseErrorResponse(response);
            throwHttpError(response, detail);
          }
        },
        { signal },
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof Error && err.message.startsWith('error.')) throw err;
      throw toProviderI18nError('openrouter', err);
    }
  },

  async generateImage(request: GenerateImageRequest) {
    const { prompt, images = [], model, apiKey, aspectRatio, imageSize, signal } = request;

    const key = apiKey.trim();
    if (!key) {
      throw createI18nError('error.openrouter_invalid_key');
    }
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const body: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      output_format: 'png',
    };
    if (images.length > 0) {
      body.input_references = images.map((img) => ({
        type: 'image_url',
        image_url: { url: toDataUrl(img) },
      }));
    }
    if (aspectRatio) body.aspect_ratio = aspectRatio;
    if (imageSize) body.resolution = imageSize;

    try {
      return await withRetryAndTimeout(
        async (combined) => {
          const response = await fetch(OPENROUTER_IMAGES_URL, {
            method: 'POST',
            headers: authHeaders(key),
            body: JSON.stringify(body),
            signal: combined,
          });

          if (!response.ok) {
            const detail = await parseErrorResponse(response);
            throwHttpError(response, detail);
          }

          const json = (await response.json()) as OpenRouterImagesResponse;
          if (json.error?.message) {
            throw new Error(json.error.message);
          }

          const costUsd = readUsageCostUsd(json);
          const first = json.data?.[0];
          if (first?.b64_json) {
            const mime = first.media_type || 'image/png';
            return { dataUrl: `data:${mime};base64,${first.b64_json}`, costUsd };
          }
          if (first?.url?.startsWith('data:')) {
            return { dataUrl: first.url, costUsd };
          }
          if (first?.url) {
            const imageResponse = await fetch(first.url, { signal: combined });
            if (!imageResponse.ok) {
              throw attachHttpMeta(
                new Error(`Failed to download OpenRouter image URL (${imageResponse.status})`),
                imageResponse.status,
                imageResponse.headers.get('Retry-After'),
              );
            }
            const buffer = await imageResponse.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 1) {
              binary += String.fromCharCode(bytes[i]!);
            }
            const b64 = btoa(binary);
            const mime = imageResponse.headers.get('content-type') || 'image/png';
            return { dataUrl: `data:${mime};base64,${b64}`, costUsd };
          }

          throw createI18nError('error.no_image');
        },
        { signal },
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof Error && err.message.startsWith('error.')) throw err;
      throw toProviderI18nError('openrouter', err);
    }
  },
};
