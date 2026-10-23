/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Prompt assembly for multi-person viral synthesis (2–4 reference portraits).
 */

import type { ViralTemplate } from '../constants/viralTemplates';

export const MULTI_PERSON_MIN = 2;
export const MULTI_PERSON_MAX = 4;

export function isValidMultiPersonCount(count: number): boolean {
  return Number.isInteger(count) && count >= MULTI_PERSON_MIN && count <= MULTI_PERSON_MAX;
}

export function clampMultiPersonCount(count: number): number {
  if (!Number.isFinite(count) || count < MULTI_PERSON_MIN) return MULTI_PERSON_MIN;
  if (count > MULTI_PERSON_MAX) return MULTI_PERSON_MAX;
  return Math.floor(count);
}

/**
 * Build a model prompt that restyles multiple attached portraits into one frame
 * while forbidding face-mixing.
 */
export function buildMultiPersonViralPrompt(options: {
  stylePrompt: string;
  personCount: number;
  /** Optional short scene label for logging / UI (English). */
  sceneHint?: string;
}): string {
  const count = clampMultiPersonCount(options.personCount);
  const style = options.stylePrompt.trim();
  const scene = options.sceneHint?.trim();

  const identityBlock =
    count === 2
      ? 'There are exactly 2 reference portraits attached, in order (person 1, person 2). Keep each person’s facial features, bone structure, age, and identity clearly distinct and recognizable. Do NOT blend, morph, or mix faces between people.'
      : `There are exactly ${count} reference portraits attached, in order (person 1 through person ${count}). Keep every person’s facial features, bone structure, age, and identity clearly distinct and recognizable. Do NOT blend, morph, or mix faces between people.`;

  const arrangement =
    count === 2
      ? 'Compose both people naturally together in one cohesive photograph (couple or duo framing).'
      : `Compose all ${count} people naturally together in one cohesive group photograph.`;

  return [
    'You are an expert multi-person portrait photographer and photo compositor.',
    scene ? `Scene: ${scene}` : null,
    `Style request: ${style}`,
    identityBlock,
    arrangement,
    'Match wardrobe and lighting to the style request, but never invent a different person or celebrity face.',
    'Output: Return ONLY the final group photograph. Do not return text.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildMultiPersonPromptFromTemplate(
  template: Pick<ViralTemplate, 'prompt' | 'id'>,
  personCount: number,
): string {
  return buildMultiPersonViralPrompt({
    stylePrompt: template.prompt,
    personCount,
    sceneHint: `viral template ${template.id}`,
  });
}
