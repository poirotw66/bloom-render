/**
 * Provider-agnostic image generation for BloomRender (BYOK).
 * Prompt optimization (text) stays on the Gemini SDK path.
 */

export type ImageProviderId = 'gemini' | 'openrouter';

export interface ImagePart {
  mimeType: string;
  /** Raw base64 without data-URL prefix. */
  data: string;
}

export interface GenerateImageRequest {
  prompt: string;
  /** Ordered reference / subject images (may be empty for text-to-image). */
  images?: ImagePart[];
  model: string;
  apiKey: string;
  aspectRatio?: string;
  imageSize?: string;
  signal?: AbortSignal;
  /**
   * When true, Gemini requests TEXT+IMAGE modalities and imageConfig.
   * Editor edit/filter/adjust historically omit this; keep false for those.
   */
  includeImageConfig?: boolean;
}

export interface ImageProvider {
  readonly id: ImageProviderId;
  /** Returns a data URL (`data:image/...;base64,...`). */
  generateImage(request: GenerateImageRequest): Promise<string>;
  validateApiKey(apiKey: string, signal?: AbortSignal): Promise<void>;
}

export const IMAGE_PROVIDER_IDS: readonly ImageProviderId[] = ['gemini', 'openrouter'] as const;

export function isImageProviderId(value: string): value is ImageProviderId {
  return (IMAGE_PROVIDER_IDS as readonly string[]).includes(value);
}
