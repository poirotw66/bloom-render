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
import { demoAssetsForFeature } from '../services/imageProviders/demoCatalog';
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
} | null {
  const template = resolveRemixToTemplate(payload);
  if (template) {
    return {
      prompt: template.prompt,
      tab: template.tab ?? 'retouch',
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

/**
 * Apply a viral template: prefer opening the editor (selfie → transform).
 * In demo mode, load the bundled sample immediately; otherwise stash remix and
 * send the user to upload.
 */
export async function applyViralTemplate(
  template: ViralTemplate,
  navigate: NavigateFunction,
  options?: { demoMode?: boolean; openUpload?: boolean },
): Promise<void> {
  const payload = remixPayloadForTemplate(template);
  setPendingRemix(payload);

  if (template.feature === 'generate') {
    const state: GenerateGalleryLocationState = {
      galleryPreset: {
        prompt: template.prompt,
        aspectRatio: template.aspectRatio,
        quantity: template.quantity,
      },
    };
    navigate(ROUTES.GENERATE, { state });
    return;
  }

  if (options?.demoMode) {
    const before = demoAssetsForFeature('editor').before;
    if (before) {
      const initialFile = await fetchPublicImageAsFile(before, 'viral-editor-sample.webp');
      const state: EditorLocationState = {
        initialFile,
        galleryPreset: {
          prompt: template.prompt,
          tab: template.tab ?? 'retouch',
        },
      };
      navigate(ROUTES.EDIT, { state });
      return;
    }
  }

  navigate(options?.openUpload === false ? ROUTES.EDIT : ROUTES.HOME, {
    state: { remixReady: true, remixTemplateId: template.id },
  });
}
