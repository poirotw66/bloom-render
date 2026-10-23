/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Full-frame viral style transform (one subject photo → one styled result).
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import type { ServiceSettings } from './shared';

/** Wrap a viral template prompt for a whole-image restyle of one portrait. */
export function buildViralStylePrompt(stylePrompt: string): string {
  return [
    'You are an expert photo transformation AI.',
    `Style request: ${stylePrompt.trim()}`,
    'Apply the style to the attached portrait. Preserve the subject’s facial features, likeness, and identity.',
    'Output: Return ONLY the final styled image. Do not return text.',
  ].join('\n');
}

export async function generateViralStyleImage(
  originalImage: File,
  stylePrompt: string,
  settings?: ServiceSettings,
  aspectRatio?: string,
): Promise<string> {
  logger.debug('Starting viral style generation');
  return runImageGeneration({
    prompt: buildViralStylePrompt(stylePrompt),
    images: [originalImage],
    settings,
    aspectRatio,
    includeImageConfig: true,
    context: 'viral-style',
  });
}
