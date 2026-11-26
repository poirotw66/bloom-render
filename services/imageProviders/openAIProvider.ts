import { PROVIDER_ENDPOINTS } from '../../constants/networkSources.mjs';
import { createI18nError } from '../gemini/shared';
import { attachHttpMeta, isAbortError, withRetryAndTimeout } from '../retry';
import { isOpenAIModel } from './models';
import { toProviderI18nError } from './providerErrors';
import type { GenerateImageRequest, ImagePart, ImageProvider } from './types';

const API_ROOT = PROVIDER_ENDPOINTS.openai;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const OUTPUT_PIXELS: Record<string, number> = {
  '1K': 1024 * 1024,
  '2K': 2048 * 2048,
  '4K': 8_294_400,
};

export function getOpenAIImageSize(model: string, aspectRatio = '1:1', imageSize = '1K'): string {
  const parts = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(aspectRatio);
  if (!parts || !Object.hasOwn(OUTPUT_PIXELS, imageSize)) {
    throw createI18nError('error.invalid_request');
  }
  const ratio = Number(parts[1]) / Number(parts[2]);
  if (!Number.isFinite(ratio) || ratio < 1 / 3 || ratio > 3) {
    throw createI18nError('error.invalid_request');
  }
  if (model === 'gpt-image-1.5') {
    return ratio > 1 ? '1536x1024' : ratio < 1 ? '1024x1536' : '1024x1024';
  }

  const pixels = OUTPUT_PIXELS[imageSize]!;
  const width = Math.sqrt(pixels * ratio);
  const height = Math.sqrt(pixels / ratio);
  const scale = Math.min(1, 3840 / Math.max(width, height));
  let w = Math.floor((width * scale) / 16) * 16;
  let h = Math.floor((height * scale) / 16) * 16;
  // Rounding must not push either extreme aspect ratio beyond the API's 3:1 limit.
  w = Math.min(w, h * 3);
  h = Math.min(h, w * 3);
  return `${w}x${h}`;
}

function imageBlob(image: ImagePart): Blob {
  if (!Object.hasOwn(IMAGE_EXTENSIONS, image.mimeType)) {
    throw createI18nError('error.invalid_request');
  }
  let binary: string;
  try {
    binary = atob(image.data);
  } catch {
    throw createI18nError('error.invalid_request');
  }
  if (!binary.length || binary.length >= 50_000_000) {
    throw createI18nError('error.invalid_request');
  }
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], {
    type: image.mimeType,
  });
}

async function throwResponseError(response: Response): Promise<never> {
  let code: unknown;
  try {
    const body = (await response.json()) as { error?: { code?: unknown } } | null;
    code = body?.error?.code;
  } catch {
    // Response text can contain credentials. Only allowlisted error codes cross this boundary.
  }
  if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') {
    throw createI18nError('error.openai_billing');
  }
  const error = attachHttpMeta(
    new Error('OpenAI image request failed'),
    response.status,
    response.headers.get('Retry-After'),
  );
  if (code === 'content_policy_violation' || code === 'moderation_blocked') {
    Object.assign(error, { code });
  }
  throw error;
}

function rethrowProviderError(error: unknown): never {
  if (isAbortError(error)) throw error;
  throw toProviderI18nError('openai', error);
}

export const openAIImageProvider: ImageProvider = {
  id: 'openai',

  async validateApiKey(apiKey, signal) {
    if (!apiKey.trim()) throw createI18nError('error.openai_invalid_key');
    try {
      await withRetryAndTimeout(
        async (combined) => {
          const response = await fetch(`${API_ROOT}/models`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey.trim()}` },
            signal: combined,
          });
          if (!response.ok) await throwResponseError(response);
        },
        { signal },
      );
    } catch (error) {
      rethrowProviderError(error);
    }
  },

  async generateImage(request: GenerateImageRequest) {
    const { prompt, images = [], model, apiKey, aspectRatio, imageSize, signal, mask } = request;
    if (!apiKey.trim()) throw createI18nError('error.openai_invalid_key');
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (
      !isOpenAIModel(model) ||
      !prompt.trim() ||
      prompt.length > 32_000 ||
      images.length > 16 ||
      mask
    ) {
      throw createI18nError('error.invalid_request');
    }
    const size = getOpenAIImageSize(model, aspectRatio, imageSize);
    const fields = { model, prompt, n: '1', output_format: 'png', size };
    let body: string | FormData;
    const headers: Record<string, string> = { Authorization: `Bearer ${apiKey.trim()}` };
    if (images.length) {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.append(key, value);
      if (model === 'gpt-image-1.5') form.append('input_fidelity', 'high');
      images.forEach((image, index) => {
        form.append(
          'image[]',
          imageBlob(image),
          `reference-${index + 1}.${IMAGE_EXTENSIONS[image.mimeType]}`,
        );
      });
      body = form;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ ...fields, n: 1 });
    }

    try {
      const result = await withRetryAndTimeout(
        async (combined) => {
          const response = await fetch(
            `${API_ROOT}/images/${images.length ? 'edits' : 'generations'}`,
            { method: 'POST', headers, body, signal: combined },
          );
          if (!response.ok) await throwResponseError(response);
          return (await response.json()) as { data?: { b64_json?: unknown }[] } | null;
        },
        { signal },
      );
      const base64 = result?.data?.[0]?.b64_json;
      if (typeof base64 !== 'string' || !base64.trim()) {
        throw createI18nError('error.no_image');
      }
      try {
        if (!atob(base64).length) throw new Error();
      } catch {
        throw createI18nError('error.no_image');
      }
      return { dataUrl: `data:image/png;base64,${base64}` };
    } catch (error) {
      rethrowProviderError(error);
    }
  },
};
