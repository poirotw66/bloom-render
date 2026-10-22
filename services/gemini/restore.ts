/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Old photo restoration (+ optional colorization) via the active image provider.
 */

import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import type { ServiceSettings } from './shared';

export type RestoreOptions = {
  /** When true, also produce natural color from a B&W / faded source. */
  colorize?: boolean;
  settings?: ServiceSettings;
};

function buildRestorePrompt(colorize: boolean): string {
  const colorClause = colorize
    ? `Also COLORIZE the photo with natural, historically plausible colors (skin, clothing, background). Avoid neon or oversaturated looks.`
    : `Preserve the original color palette (including black-and-white or sepia if that is how the source appears). Do not invent new colors.`;

  return `You are an expert photo restoration artist. Restore this old or damaged photograph.

Tasks:
- Repair scratches, tears, dust spots, stains, and crease marks.
- Reduce film grain / sensor noise carefully while keeping natural skin and fabric texture.
- Recover faded contrast and correct yellowing or chemical staining.
- Reconstruct missing edge detail only when clearly implied; do not invent new people or objects.
- Keep identity, pose, clothing, and composition faithful to the original.
- ${colorClause}

Output: Return ONLY the restored photograph. No text, borders, watermarks, or captions.`;
}

/**
 * Restore an old photo (scratches / fading / noise), optionally colorizing.
 */
export async function generateRestoredPhoto(
  originalImage: File,
  options: RestoreOptions = {},
): Promise<string> {
  const colorize = Boolean(options.colorize);
  logger.debug(`Starting photo restoration (colorize=${colorize})`);

  return runImageGeneration({
    prompt: buildRestorePrompt(colorize),
    images: [originalImage],
    settings: options.settings,
    includeImageConfig: false,
    context: 'restore',
  });
}

export { buildRestorePrompt };
