/**
 * Provider-agnostic image generation for BloomRender (BYOK).
 * Prompt optimization (text) stays on the Gemini SDK path.
 */

export type ImageProviderId = 'gemini' | 'openrouter' | 'demo';

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
  /** Feature context (e.g. id-photo, travel) — used by the demo provider. */
  context?: string;
}

/** Result of one provider call; `costUsd` is set when the API reports a real charge. */
export interface GenerateImageResult {
  dataUrl: string;
  /** Actual billed USD when the provider returns usage/cost (e.g. OpenRouter). */
  costUsd?: number;
}

export interface ImageProvider {
  readonly id: ImageProviderId;
  generateImage(request: GenerateImageRequest): Promise<GenerateImageResult>;
  validateApiKey(apiKey: string, signal?: AbortSignal): Promise<void>;
}

/** Providers shown in Settings (includes offline demo). */
export const IMAGE_PROVIDER_IDS: readonly ImageProviderId[] = [
  'gemini',
  'openrouter',
  'demo',
] as const;

export function isImageProviderId(value: string): value is ImageProviderId {
  return (IMAGE_PROVIDER_IDS as readonly string[]).includes(value);
}

export function isDemoProvider(id: ImageProviderId | string | undefined | null): boolean {
  return id === 'demo';
}
