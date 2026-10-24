/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Offline demo ImageProvider: no API key, no network calls to AI providers.
 * Returns bundled public/examples images after a short simulated delay.
 * Viral-template results use each template's own thumbnail (see demoViralResult).
 */

import { publicAssetUrl } from '../../utils/publicAsset';
import { createI18nError } from '../gemini/shared';
import { DEMO_MODEL_ID, demoAssetsForContext } from './demoCatalog';
import { applyDemoViralVariation, resolveDemoResultAssetPath } from './demoViralResult';
import type { GenerateImageRequest, ImageProvider } from './types';

const MIN_DELAY_MS = 700;
const MAX_DELAY_MS = 1400;

/** Per-context call counts so batch/quantity requests cycle variants. */
const variantCounters = new Map<string, number>();

function nextVariantIndex(context: string, count: number): number {
  const prev = variantCounters.get(context) ?? 0;
  variantCounters.set(context, prev + 1);
  return prev % Math.max(1, count);
}

/** Reset variant counters (tests). */
export function resetDemoVariantCounters(): void {
  variantCounters.clear();
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Fetch a public asset and return a data URL (so callers match real providers).
 */
export async function fetchPublicImageAsDataUrl(
  path: string,
  signal?: AbortSignal,
): Promise<string> {
  const url = publicAssetUrl(path);
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw createI18nError('error.demo_asset_missing');
  }
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const mime = blob.type || 'image/webp';
  return `data:${mime};base64,${btoa(binary)}`;
}

export async function fetchPublicImageAsFile(
  path: string,
  fileName: string,
  signal?: AbortSignal,
): Promise<File> {
  const url = publicAssetUrl(path);
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw createI18nError('error.demo_asset_missing');
  }
  const blob = await res.blob();
  const type = blob.type || 'image/webp';
  return new File([blob], fileName, { type });
}

function simulatedDelayMs(): number {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

export const demoImageProvider: ImageProvider = {
  id: 'demo',

  async validateApiKey(_apiKey: string, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    // No key required.
  },

  async generateImage(request: GenerateImageRequest) {
    if (request.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const context = request.context || 'generation';
    const viralPath = resolveDemoResultAssetPath({
      context,
      viralTemplateId: request.viralTemplateId,
    });

    await sleep(simulatedDelayMs(), request.signal);

    if (viralPath) {
      const variationKey = `viral:${request.viralTemplateId}`;
      const variationIndex = nextVariantIndex(variationKey, 4);
      const base = await fetchPublicImageAsDataUrl(viralPath, request.signal);
      const dataUrl = await applyDemoViralVariation(base, variationIndex);
      return { dataUrl, costUsd: 0 };
    }

    if (context === 'viral-style' || context === 'multi-person') {
      throw createI18nError('error.demo_asset_missing');
    }

    const assets = demoAssetsForContext(context);
    if (!assets.after.length) {
      throw createI18nError('error.demo_asset_missing');
    }
    const index = nextVariantIndex(context, assets.after.length);
    const afterPath = assets.after[index] ?? assets.after[0];
    const dataUrl = await fetchPublicImageAsDataUrl(afterPath!, request.signal);
    return { dataUrl, costUsd: 0 };
  },
};

export { DEMO_MODEL_ID };
