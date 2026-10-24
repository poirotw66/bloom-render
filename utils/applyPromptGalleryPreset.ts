/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Navigate to the right feature surface and seed the prompt (and optional
 * generate settings) from a community gallery entry.
 */

import type { NavigateFunction } from 'react-router-dom';
import type { PromptGalleryEntry } from '../constants/promptGallery';
import { savedPromptScopeForFeature } from '../constants/promptGallery';
import { ROUTES } from '../constants/routes';
import type { EditorLocationState } from '../features/editor/EditorPage';
import { demoAssetsForFeature } from '../services/imageProviders/demoCatalog';
import { fetchPublicImageAsFile } from '../services/imageProviders/demoProvider';
import { savePromptToScope } from './savedPromptsIo';

export type GenerateGalleryLocationState = {
  galleryPreset?: {
    prompt: string;
    aspectRatio?: PromptGalleryEntry['settings']['aspectRatio'];
    quantity?: number;
    /** When set (viral templates), demo results use this template's thumbnail. */
    viralTemplateId?: string;
  };
};

export async function applyPromptGalleryPreset(
  entry: PromptGalleryEntry,
  navigate: NavigateFunction,
): Promise<void> {
  savePromptToScope(savedPromptScopeForFeature(entry.feature), entry.prompt);

  if (entry.feature === 'generate') {
    const state: GenerateGalleryLocationState = {
      galleryPreset: {
        prompt: entry.prompt,
        aspectRatio: entry.settings.aspectRatio,
        quantity: entry.settings.quantity,
      },
    };
    navigate(ROUTES.GENERATE, { state });
    return;
  }

  const before = demoAssetsForFeature('editor').before;
  if (!before) {
    navigate(ROUTES.HOME);
    return;
  }
  const initialFile = await fetchPublicImageAsFile(before, 'gallery-editor-sample.webp');
  const tab =
    entry.settings.tab ??
    (entry.feature === 'filter' ? 'filters' : entry.feature === 'adjust' ? 'adjust' : 'retouch');
  const state: EditorLocationState = {
    initialFile,
    galleryPreset: {
      prompt: entry.prompt,
      tab,
    },
  };
  navigate(ROUTES.EDIT, { state });
}
