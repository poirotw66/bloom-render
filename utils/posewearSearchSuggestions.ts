/**
 * @license
 * Copyright (c) 2026 PoseWear contributors
 * SPDX-License-Identifier: MIT
 * Adapted from recent searches and suggestions in PoseWear src/extras.js at
 * f9f55db356464af87f97b39f5bb57930ed0cd6df.
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/extras.js
 * Full notice: public/licenses/posewear-MIT.txt.
 * Validated bounded local strings and original catalog titles replace globals.
 */
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
export const MATERIAL_SEARCH_HISTORY_KEY = 'bloom_material_search_history';
export function normalizeSearchQuery(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}
export function parseMaterialSearchHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(normalizeSearchQuery)
    .filter((item) => {
      const key = item.toLocaleLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}
export function readMaterialSearchHistory(): string[] {
  try {
    return parseMaterialSearchHistory(
      JSON.parse(localStorage.getItem(MATERIAL_SEARCH_HISTORY_KEY) ?? '[]'),
    );
  } catch {
    return [];
  }
}
export function saveMaterialSearchHistory(value: string[]): boolean {
  try {
    localStorage.setItem(
      MATERIAL_SEARCH_HISTORY_KEY,
      JSON.stringify(parseMaterialSearchHistory(value)),
    );
    return true;
  } catch {
    return false;
  }
}
export function materialSearchSuggestions(
  query: string,
  role: string,
  language: 'en' | 'zh-TW',
): string[] {
  const normalized = normalizeSearchQuery(query).toLocaleLowerCase();
  return [
    ...new Set(
      TRYON_MATERIALS.filter((item) => role === 'all' || item.role === role).map((item) =>
        language === 'en' ? item.title : item.titleZh,
      ),
    ),
  ]
    .filter(
      (title) =>
        title.toLocaleLowerCase().includes(normalized) && title.toLocaleLowerCase() !== normalized,
    )
    .slice(0, 5);
}
