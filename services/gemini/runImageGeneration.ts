/**
 * Routes image generation through the ImageProvider abstraction.
 * Feature modules build prompts / file lists; this helper talks to Gemini or OpenRouter.
 */

import { lookupImagePriceUsd } from '../../constants/imagePricing';
import { logger } from '../../utils/logger';
import { recordSessionSpendUsd } from '../../utils/sessionSpend';
import { getImageProvider, type ImageProviderId, type ImagePart } from '../imageProviders';
import { fileToPartAuto, type ServiceSettings } from './shared';

export interface RunImageGenerationOptions {
  prompt: string;
  images?: File[];
  /** Binary edit mask (white = change). Forwarded only when the provider supports it. */
  mask?: File;
  settings?: ServiceSettings;
  aspectRatio?: string;
  imageSize?: '1K' | '2K' | '4K';
  /** Default true. Set false for editor edit/filter/adjust (legacy Gemini config). */
  includeImageConfig?: boolean;
  context?: string;
}

async function filesToImageParts(files: File[]): Promise<ImagePart[]> {
  const parts: ImagePart[] = [];
  for (const file of files) {
    const part = await fileToPartAuto(file);
    parts.push({
      mimeType: part.inlineData.mimeType,
      data: part.inlineData.data,
    });
  }
  return parts;
}

function resolveProvider(settings?: ServiceSettings): ImageProviderId {
  if (settings?.provider === 'openrouter') return 'openrouter';
  if (settings?.provider === 'demo') return 'demo';
  return 'gemini';
}

/**
 * Generate one image via the selected provider. Returns a data URL.
 */
export async function runImageGeneration(options: RunImageGenerationOptions): Promise<string> {
  const {
    prompt,
    images = [],
    mask,
    settings,
    aspectRatio,
    imageSize,
    includeImageConfig = true,
    context = 'generation',
  } = options;

  const providerId = resolveProvider(settings);
  const apiKey = settings?.apiKey?.trim() || '';
  const model = settings?.model || '';

  logger.debug(`runImageGeneration via ${providerId}`, {
    context,
    model,
    imageCount: images.length,
    hasMask: Boolean(mask),
    aspectRatio,
    imageSize,
    includeImageConfig,
  });

  const imageParts = await filesToImageParts(images);
  const maskParts = mask ? await filesToImageParts([mask]) : [];
  const provider = getImageProvider(providerId);
  const resolvedModel = providerId === 'demo' ? model || 'demo-samples' : model;

  const result = await provider.generateImage({
    prompt,
    images: imageParts,
    mask: maskParts[0],
    model: resolvedModel,
    apiKey: providerId === 'demo' ? apiKey || 'demo' : apiKey,
    aspectRatio,
    imageSize,
    signal: settings?.abortSignal,
    includeImageConfig,
    context,
  });

  // Prefer real OpenRouter usage.cost; otherwise fall back to the published table.
  if (typeof result.costUsd === 'number' && Number.isFinite(result.costUsd)) {
    if (result.costUsd > 0) recordSessionSpendUsd(result.costUsd);
  } else if (providerId !== 'demo') {
    const estimated = lookupImagePriceUsd(resolvedModel, imageSize);
    if (typeof estimated === 'number' && estimated > 0) {
      recordSessionSpendUsd(estimated);
    }
  }

  return result.dataUrl;
}
