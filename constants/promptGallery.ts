/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Community prompt gallery entries loaded from /gallery/*.json at build time.
 */

export type PromptGalleryFeature = 'generate' | 'retouch' | 'adjust' | 'filter';

export interface PromptGallerySettings {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  quantity?: number;
  tab?: 'retouch' | 'adjust' | 'filters';
}

export interface PromptGalleryEntry {
  id: string;
  title: string;
  prompt: string;
  feature: PromptGalleryFeature;
  settings: PromptGallerySettings;
  /** Optional; omit when no title-matching asset exists (UI uses a gradient card). */
  thumbnail?: string;
  description?: string;
  author?: string;
  tags?: string[];
}

const modules = import.meta.glob('../gallery/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, PromptGalleryEntry>;

function isEntry(value: unknown): value is PromptGalleryEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as PromptGalleryEntry;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.prompt === 'string' &&
    typeof v.feature === 'string' &&
    !!v.settings &&
    typeof v.settings === 'object' &&
    (v.thumbnail === undefined || typeof v.thumbnail === 'string')
  );
}

/** All community gallery presets, sorted by title. */
export const PROMPT_GALLERY_ENTRIES: PromptGalleryEntry[] = Object.entries(modules)
  .filter(([filePath]) => !filePath.endsWith('/schema.json'))
  .map(([, value]) => value)
  .filter(isEntry)
  .sort((a, b) => a.title.localeCompare(b.title));

export function savedPromptScopeForFeature(feature: PromptGalleryFeature): string {
  return feature;
}
