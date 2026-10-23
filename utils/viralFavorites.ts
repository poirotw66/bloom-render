/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Favorites + recently-used viral templates (localStorage, bloom_ prefix).
 */

const FAVORITES_KEY = 'bloom_viral_favorites';
const RECENT_KEY = 'bloom_viral_recent';
export const VIRAL_RECENT_MAX = 8;

function readJsonArray(key: string): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, value: string[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getViralFavorites(): string[] {
  return readJsonArray(FAVORITES_KEY);
}

export function isViralFavorite(id: string): boolean {
  return getViralFavorites().includes(id);
}

export function toggleViralFavorite(id: string): string[] {
  const cur = getViralFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  writeJsonArray(FAVORITES_KEY, next);
  return next;
}

export function clearViralFavorites(): void {
  writeJsonArray(FAVORITES_KEY, []);
}

export function getViralRecent(): string[] {
  return readJsonArray(RECENT_KEY).slice(0, VIRAL_RECENT_MAX);
}

/** Push id to the front of recent list (deduped, capped). */
export function pushViralRecent(id: string, max = VIRAL_RECENT_MAX): string[] {
  const next = [id, ...getViralRecent().filter((x) => x !== id)].slice(0, max);
  writeJsonArray(RECENT_KEY, next);
  return next;
}

export function clearViralRecent(): void {
  writeJsonArray(RECENT_KEY, []);
}

export { FAVORITES_KEY, RECENT_KEY };
