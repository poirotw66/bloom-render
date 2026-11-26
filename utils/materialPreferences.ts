import { useSyncExternalStore } from 'react';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';

export const MATERIAL_PREFERENCES_STORAGE_KEY = 'bloom_material_preferences';
export const MATERIAL_RECENT_LIMIT = 12;
export interface MaterialPreferences {
  favoriteIds: string[];
  recentIds: string[];
}
interface Snapshot extends MaterialPreferences {
  storageAvailable: boolean;
}
const knownIds = new Set(TRYON_MATERIALS.map((material) => material.id));
const empty: Snapshot = { favoriteIds: [], recentIds: [], storageAvailable: true };
let snapshot = empty;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

export function parseMaterialPreferences(value: unknown): MaterialPreferences {
  const clean = (ids: unknown, limit: number) =>
    Array.isArray(ids)
      ? [
          ...new Set(ids.filter((id): id is string => typeof id === 'string' && knownIds.has(id))),
        ].slice(0, limit)
      : [];
  const data = value && typeof value === 'object' ? (value as Partial<MaterialPreferences>) : {};
  return {
    favoriteIds: clean(data.favoriteIds, knownIds.size),
    recentIds: clean(data.recentIds, MATERIAL_RECENT_LIMIT),
  };
}

function getSnapshot(): Snapshot {
  try {
    const raw = localStorage.getItem(MATERIAL_PREFERENCES_STORAGE_KEY);
    if (raw !== lastRaw) {
      let parsed: unknown;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = null;
      }
      snapshot = { ...parseMaterialPreferences(parsed), storageAvailable: true };
      lastRaw = raw;
    }
  } catch {
    if (snapshot.storageAvailable) snapshot = { ...snapshot, storageAvailable: false };
  }
  return snapshot;
}
function emit() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === MATERIAL_PREFERENCES_STORAGE_KEY || event.key === null) {
      getSnapshot();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
function save(next: MaterialPreferences) {
  const clean = parseMaterialPreferences(next);
  let storageAvailable = true;
  try {
    const raw = JSON.stringify(clean);
    localStorage.setItem(MATERIAL_PREFERENCES_STORAGE_KEY, raw);
    lastRaw = raw;
  } catch {
    storageAvailable = false;
  }
  snapshot = { ...clean, storageAvailable };
  emit();
}
export function recordMaterialUse(id: string) {
  if (!knownIds.has(id)) return;
  const current = getSnapshot();
  save({ ...current, recentIds: [id, ...current.recentIds.filter((entry) => entry !== id)] });
}
export function toggleMaterialFavorite(id: string) {
  if (!knownIds.has(id)) return;
  const current = getSnapshot();
  save({
    ...current,
    favoriteIds: current.favoriteIds.includes(id)
      ? current.favoriteIds.filter((entry) => entry !== id)
      : [...current.favoriteIds, id],
  });
}
export function clearRecentMaterials() {
  save({ ...getSnapshot(), recentIds: [] });
}
export function useMaterialPreferences() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  return {
    ...state,
    isFavorite: (id: string) => state.favoriteIds.includes(id),
    toggleFavorite: toggleMaterialFavorite,
    clearRecent: clearRecentMaterials,
  };
}
