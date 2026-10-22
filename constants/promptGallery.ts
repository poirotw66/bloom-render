/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Community prompt gallery entries loaded from /gallery/*.json at build time.
 */

import type { Language } from '../contexts/LanguageContext';

export type PromptGalleryFeature = 'generate' | 'retouch' | 'adjust' | 'filter';

export interface PromptGallerySettings {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  quantity?: number;
  tab?: 'retouch' | 'adjust' | 'filters';
}

export interface PromptGalleryEntry {
  id: string;
  /** English display title. */
  title: string;
  /** Traditional Chinese (Taiwan) display title — required. */
  titleZh: string;
  prompt: string;
  feature: PromptGalleryFeature;
  settings: PromptGallerySettings;
  /** Optional; omit when no title-matching asset exists (UI uses a gradient card). */
  thumbnail?: string;
  description?: string;
  descriptionZh?: string;
  author?: string;
  tags?: string[];
  tagsZh?: string[];
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
    typeof v.titleZh === 'string' &&
    v.titleZh.trim().length > 0 &&
    typeof v.prompt === 'string' &&
    typeof v.feature === 'string' &&
    !!v.settings &&
    typeof v.settings === 'object' &&
    (v.thumbnail === undefined || typeof v.thumbnail === 'string')
  );
}

/** All community gallery presets, sorted by English title. */
export const PROMPT_GALLERY_ENTRIES: PromptGalleryEntry[] = Object.entries(modules)
  .filter(([filePath]) => !filePath.endsWith('/schema.json'))
  .map(([, value]) => value)
  .filter(isEntry)
  .sort((a, b) => a.title.localeCompare(b.title));

export function savedPromptScopeForFeature(feature: PromptGalleryFeature): string {
  return feature;
}

export function localizedGalleryTitle(entry: PromptGalleryEntry, language: Language): string {
  return language === 'zh-TW' ? entry.titleZh : entry.title;
}

export function localizedGalleryDescription(
  entry: PromptGalleryEntry,
  language: Language,
): string | undefined {
  if (language === 'zh-TW') {
    return entry.descriptionZh || entry.description;
  }
  return entry.description;
}

export function localizedGalleryTags(
  entry: PromptGalleryEntry,
  language: Language,
): string[] | undefined {
  if (language === 'zh-TW') {
    return entry.tagsZh?.length ? entry.tagsZh : entry.tags;
  }
  return entry.tags;
}
