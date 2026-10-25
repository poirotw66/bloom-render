/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import type { NavigateFunction } from 'react-router-dom';
import {
  getViralTemplateById,
  type ViralTemplate,
  VIRAL_TEMPLATE_IDS,
} from '../constants/viralTemplates';
import { ROUTES } from '../constants/routes';
import type { EditorLocationState } from '../features/editor/EditorPage';
import { fetchPublicImageAsFile } from '../services/imageProviders/demoProvider';
import type { RemixPayload } from './remixLink';
import { buildRemixUrl } from './remixLink';
import { setPendingRemix } from './pendingRemix';
import type { GenerateGalleryLocationState } from './applyPromptGalleryPreset';

export function remixPayloadForTemplate(template: ViralTemplate): RemixPayload {
  return { v: 1, id: template.id };
}

export function remixUrlForTemplate(template: ViralTemplate): string {
  return buildRemixUrl(remixPayloadForTemplate(template));
}

export function resolveRemixToTemplate(payload: RemixPayload): ViralTemplate | null {
  if ('id' in payload && payload.id) {
    if (!VIRAL_TEMPLATE_IDS.has(payload.id)) return null;
    return getViralTemplateById(payload.id) ?? null;
  }
  return null;
}

/** Map a remix payload into editor / generate location state pieces. */
export function remixToEditorPreset(payload: RemixPayload): {
  prompt: string;
  tab: 'retouch' | 'adjust' | 'filters';
  viralTemplateId?: string;
} | null {
  const template = resolveRemixToTemplate(payload);
  if (template) {
    return {
      prompt: template.prompt,
      tab: template.tab ?? 'retouch',
      viralTemplateId: template.id,
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

export function remixToGeneratePreset(
  payload: RemixPayload,
): GenerateGalleryLocationState['galleryPreset'] | null {
  const template = resolveRemixToTemplate(payload);
  if (template && template.feature === 'generate') {
    return {
      prompt: template.prompt,
      aspectRatio: template.aspectRatio,
      quantity: template.quantity,
      viralTemplateId: template.id,
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
  template: ViralTemplate,
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
  template: ViralTemplate,
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

  if (target === 'generate') {
    const state: GenerateGalleryLocationState = {
      galleryPreset: {
        prompt: template.prompt,
        aspectRatio: template.aspectRatio,
        quantity: template.quantity,
        viralTemplateId: template.id,
      },
    };
    navigate(ROUTES.GENERATE, { state });
    return;
  }

  const galleryPreset: NonNullable<EditorLocationState['galleryPreset']> = {
    prompt: template.prompt,
    tab: template.tab ?? 'retouch',
    viralTemplateId: template.id,
  };

  if (options?.demoMode) {
    // Use this template’s own preview as the demo sample so the editor matches
    // the card the user tapped (results also resolve to the same thumb).
    const thumbPath = template.thumbnail.startsWith('/')
      ? template.thumbnail
      : `/${template.thumbnail}`;
    const initialFile = await fetchPublicImageAsFile(thumbPath, `${template.id}-demo.webp`);
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
