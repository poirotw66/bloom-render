/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Full viral templates (cards + prompts). Prefer `viralTemplateCards` on the
 * homepage; import this module from apply / generate paths that need prompts.
 */

import {
  GENERIC_EXAMPLE_THUMBNAILS,
  VIRAL_TEMPLATE_CARDS,
  VIRAL_TEMPLATE_IDS,
  getMultiPersonViralTemplateCards,
  getViralTemplateCardById,
  type ViralTemplate,
  type ViralTemplateCard,
  type ViralTemplateCategory,
  type ViralTemplateFeature,
} from './viralTemplateCards';
import { VIRAL_TEMPLATE_PROMPTS, getViralPrompt } from './viralTemplatePrompts';

export type { ViralTemplate, ViralTemplateCard, ViralTemplateCategory, ViralTemplateFeature };
export {
  GENERIC_EXAMPLE_THUMBNAILS,
  VIRAL_TEMPLATE_CARDS,
  VIRAL_TEMPLATE_IDS,
  getMultiPersonViralTemplateCards,
  getViralTemplateCardById,
  getViralPrompt,
};

/** Full catalog with prompts (for collage / multi-person / tests). */
export const VIRAL_TEMPLATES: ViralTemplate[] = VIRAL_TEMPLATE_CARDS.map((card) => ({
  ...card,
  prompt: getViralPrompt(card.id),
}));

export function getViralTemplateById(id: string): ViralTemplate | undefined {
  const card = getViralTemplateCardById(id);
  if (!card) return undefined;
  return { ...card, prompt: getViralPrompt(id) };
}

export function getMultiPersonViralTemplates(): ViralTemplate[] {
  return getMultiPersonViralTemplateCards().map((card) => ({
    ...card,
    prompt: getViralPrompt(card.id),
  }));
}

/** Ensure prompts module is referenced so tree-shaking keeps the map complete. */
void VIRAL_TEMPLATE_PROMPTS;
