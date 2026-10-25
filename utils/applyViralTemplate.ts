/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Apply / remix helpers. Card catalog is static; model prompts are dynamic-imported
 * so the homepage viral section does not ship all 79 prompt strings.
 */

import type { NavigateFunction } from 'react-router-dom';
import {
  getViralTemplateCardById,
  VIRAL_TEMPLATE_IDS,
  type ViralTemplate,
  type ViralTemplateCard,
} from '../constants/viralTemplateCards';
import { ROUTES } from '../constants/routes';
import type { EditorLocationState } from '../features/editor/EditorPage';
import { fetchPublicImageAsFile } from '../services/imageProviders/demoProvider';
import type { RemixPayload } from './remixLink';
import { buildRemixUrl } from './remixLink';
import { setPendingRemix } from './pendingRemix';
import type { GenerateGalleryLocationState } from './applyPromptGalleryPreset';

export async function loadViralTemplate(id: string): Promise<ViralTemplate | undefined> {
  const card = getViralTemplateCardById(id);
  if (!card) return undefined;
  const { getViralPrompt } = await import('../constants/viralTemplatePrompts');
  return { ...card, prompt: getViralPrompt(id) };
}

export async function withViralPrompt(
  card: ViralTemplateCard | ViralTemplate,
): Promise<ViralTemplate> {
  if ('prompt' in card && typeof card.prompt === 'string' && card.prompt.length > 0) {
    return card as ViralTemplate;
  }
  const { getViralPrompt } = await import('../constants/viralTemplatePrompts');
  return { ...card, prompt: getViralPrompt(card.id) };
}

export function remixPayloadForTemplate(template: ViralTemplateCard | ViralTemplate): RemixPayload {
  return { v: 1, id: template.id };
}

export function remixUrlForTemplate(template: ViralTemplateCard | ViralTemplate): string {
  return buildRemixUrl(remixPayloadForTemplate(template));
}

export function resolveRemixToCard(payload: RemixPayload): ViralTemplateCard | null {
  if ('id' in payload && payload.id) {
    if (!VIRAL_TEMPLATE_IDS.has(payload.id)) return null;
    return getViralTemplateCardById(payload.id) ?? null;
  }
  return null;
}

export async function resolveRemixToTemplate(payload: RemixPayload): Promise<ViralTemplate | null> {
  const card = resolveRemixToCard(payload);
  if (!card) return null;
  return withViralPrompt(card);
}

/** Map a remix payload into editor / generate location state pieces. */
export async function remixToEditorPreset(payload: RemixPayload): Promise<{
  prompt: string;
  tab: 'retouch' | 'adjust' | 'filters';
  viralTemplateId?: string;
} | null> {
  const card = resolveRemixToCard(payload);
  if (card) {
    const full = await withViralPrompt(card);
    return {
      prompt: full.prompt,
      tab: full.tab ?? 'retouch',
      viralTemplateId: full.id,
    };
  }
  if (
    'f' in payload &&
    (payload.f === 'retouch' || payload.f === 'adjust' || payload.f === 'filter')
  ) {
    return {
      prompt: payload.p,
      tab:
        payload.tab ??
        (payload.f === 'filter' ? 'filters' : payload.f === 'adjust' ? 'adjust' : 'retouch'),
    };
  }
  return null;
}

export async function remixToGeneratePreset(
  payload: RemixPayload,
): Promise<GenerateGalleryLocationState['galleryPreset'] | null> {
  const card = resolveRemixToCard(payload);
  if (card && card.feature === 'generate') {
    const full = await withViralPrompt(card);
    return {
      prompt: full.prompt,
      aspectRatio: full.aspectRatio,
      quantity: full.quantity,
      viralTemplateId: full.id,
    };
  }
  if ('f' in payload && payload.f === 'generate') {
    return {
      prompt: payload.p,
      aspectRatio: payload.a,
      quantity: payload.q,
    };
  }
  return null;
}

/** Where “試試這個” / remix should land for a given template. */
export function resolveViralApplyTarget(
  template: ViralTemplateCard | ViralTemplate,
): 'multi-person' | 'generate' | 'edit' {
  if (template.supportsMultiPerson) return 'multi-person';
  if (template.feature === 'generate') return 'generate';
  return 'edit';
}

/**
 * Apply a viral template:
 * - multi-person → /multi-person with scene preselected
 * - generate → /generate with prompt / ratio / template id
 * - demo retouch → /edit with that template’s own thumbnail as the sample
 * - keyed retouch → /edit upload step (template banner + file picker)
 */
export async function applyViralTemplate(
  template: ViralTemplateCard | ViralTemplate,
  navigate: NavigateFunction,
  options?: { demoMode?: boolean; openUpload?: boolean },
): Promise<void> {
  const payload = remixPayloadForTemplate(template);
  setPendingRemix(payload);

  const target = resolveViralApplyTarget(template);

  if (target === 'multi-person') {
    navigate(ROUTES.MULTI_PERSON, {
      state: { templateId: template.id },
    });
    return;
  }

  const full = await withViralPrompt(template);

  if (target === 'generate') {
    const state: GenerateGalleryLocationState = {
      galleryPreset: {
        prompt: full.prompt,
        aspectRatio: full.aspectRatio,
        quantity: full.quantity,
        viralTemplateId: full.id,
      },
    };
    navigate(ROUTES.GENERATE, { state });
    return;
  }

  const galleryPreset: NonNullable<EditorLocationState['galleryPreset']> = {
    prompt: full.prompt,
    tab: full.tab ?? 'retouch',
    viralTemplateId: full.id,
  };

  if (options?.demoMode) {
    const thumbPath = full.thumbnail.startsWith('/') ? full.thumbnail : `/${full.thumbnail}`;
    const initialFile = await fetchPublicImageAsFile(thumbPath, `${full.id}-demo.webp`);
    const state: EditorLocationState = {
      initialFile,
      galleryPreset,
    };
    navigate(ROUTES.EDIT, { state });
    return;
  }

  if (options?.openUpload === false) {
    navigate(ROUTES.EDIT, { state: { galleryPreset } });
    return;
  }

  navigate(ROUTES.EDIT, {
    state: {
      awaitUpload: true,
      galleryPreset,
    } satisfies EditorLocationState,
  });
}
