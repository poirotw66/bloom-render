/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Generative edit: localized edit based on a prompt plus either a single-point
 * hotspot or a painted mask. Providers without a native mask parameter receive
 * a tinted overlay of the source image and a prompt that describes it.
 */

import { composeMaskOverlayImage } from '../../utils/maskBrush';
import { logger } from '../../utils/logger';
import { providerSupportsNativeMask, type ImageProviderId } from '../imageProviders';
import { runImageGeneration } from './runImageGeneration';
import type { ServiceSettings } from './shared';

export type EditHotspot = { x: number; y: number };

export type GenerateEditedImageTarget = {
  /** Single-point retouch (legacy). Ignored when `mask` is set. */
  hotspot?: EditHotspot | null;
  /** Binary mask file (white = edit region). Prefer this when present. */
  mask?: File | null;
};

const SAFETY_POLICY = `Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;

function hotspotPrompt(userPrompt: string, hotspot: EditHotspot): string {
  return `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

${SAFETY_POLICY}`;
}

function nativeMaskPrompt(userPrompt: string): string {
  return `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: A mask image is provided. White pixels mark regions to edit; black pixels must stay unchanged.

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- Do not alter areas marked black in the mask.

${SAFETY_POLICY}`;
}

function overlayMaskPrompt(userPrompt: string): string {
  return `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: The attached image has translucent pink/magenta highlights painted over the regions to change. Apply the edit only inside those highlighted regions. Remove the highlight tint in the output — return a clean photo with no overlay.

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- Areas without the highlight must remain identical to the original.

${SAFETY_POLICY}`;
}

function resolveProviderId(settings?: ServiceSettings): ImageProviderId {
  if (settings?.provider === 'openrouter') return 'openrouter';
  if (settings?.provider === 'demo') return 'demo';
  return 'gemini';
}

/**
 * Generates an edited image using generative AI based on a text prompt and
 * either a hotspot or a painted mask.
 */
export const generateEditedImage = async (
  originalImage: File,
  userPrompt: string,
  target: GenerateEditedImageTarget | EditHotspot,
  settings?: ServiceSettings,
): Promise<string> => {
  // Backward-compatible: third arg used to be only `{ x, y }`.
  const normalized: GenerateEditedImageTarget =
    target && 'x' in target && 'y' in target && !('hotspot' in target) && !('mask' in target)
      ? { hotspot: target }
      : (target as GenerateEditedImageTarget);

  if (normalized.mask) {
    const providerId = resolveProviderId(settings);
    if (providerSupportsNativeMask(providerId)) {
      logger.debug('Starting generative edit with native mask');
      return runImageGeneration({
        prompt: nativeMaskPrompt(userPrompt),
        images: [originalImage],
        mask: normalized.mask,
        settings,
        includeImageConfig: false,
        context: 'edit',
      });
    }

    logger.debug('Starting generative edit with mask overlay fallback');
    const overlay = await composeMaskOverlayImage(originalImage, normalized.mask);
    return runImageGeneration({
      prompt: overlayMaskPrompt(userPrompt),
      images: [overlay],
      settings,
      includeImageConfig: false,
      context: 'edit',
    });
  }

  const hotspot = normalized.hotspot;
  if (!hotspot) {
    throw new Error('error.invalid_request');
  }

  logger.debug('Starting generative edit at:', hotspot);
  return runImageGeneration({
    prompt: hotspotPrompt(userPrompt, hotspot),
    images: [originalImage],
    settings,
    includeImageConfig: false,
    context: 'edit',
  });
};
