/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * One-time rename of browser storage keys from the legacy `pixshop_` prefix
 * to `bloom_`. Runs on app boot before Settings/Theme/Language hydrate.
 */

export const LEGACY_STORAGE_PREFIX = 'pixshop_';
export const STORAGE_PREFIX = 'bloom_';

/** Legacy key → new key (localStorage and/or sessionStorage). */
export const STORAGE_KEY_MIGRATIONS: ReadonlyArray<{ legacy: string; next: string }> = [
  { legacy: 'pixshop_api_key', next: 'bloom_api_key' },
  { legacy: 'pixshop_openrouter_api_key', next: 'bloom_openrouter_api_key' },
  { legacy: 'pixshop_or_oauth_verifier', next: 'bloom_or_oauth_verifier' },
  { legacy: 'pixshop_or_oauth_state', next: 'bloom_or_oauth_state' },
  { legacy: 'pixshop_pending_remix', next: 'bloom_pending_remix' },
  { legacy: 'pixshop_model', next: 'bloom_model' },
  { legacy: 'pixshop_image_provider', next: 'bloom_image_provider' },
  { legacy: 'pixshop_openrouter_model', next: 'bloom_openrouter_model' },
  { legacy: 'pixshop_compression_enabled', next: 'bloom_compression_enabled' },
  { legacy: 'pixshop_compression_threshold', next: 'bloom_compression_threshold' },
  { legacy: 'pixshop_background_motion', next: 'bloom_background_motion' },
  { legacy: 'pixshop_theme', next: 'bloom_theme' },
  { legacy: 'pixshop_language', next: 'bloom_language' },
  { legacy: 'pixshop_star_nudge_dismissed', next: 'bloom_star_nudge_dismissed' },
  { legacy: 'pixshop_generation_history', next: 'bloom_generation_history' },
];

function migrateInStore(store: Storage, legacy: string, next: string): boolean {
  try {
    const legacyValue = store.getItem(legacy);
    if (legacyValue === null) return false;
    const existing = store.getItem(next);
    if (existing === null || existing === '') {
      store.setItem(next, legacyValue);
    }
    store.removeItem(legacy);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy each legacy `pixshop_*` value into `bloom_*` (preferring an existing
 * bloom value) and delete the legacy key. Safe to call repeatedly.
 */
export function migratePixshopToBloomKeys(
  local: Storage = localStorage,
  session: Storage = sessionStorage,
): { localMoved: number; sessionMoved: number } {
  let localMoved = 0;
  let sessionMoved = 0;
  for (const { legacy, next } of STORAGE_KEY_MIGRATIONS) {
    if (migrateInStore(local, legacy, next)) localMoved += 1;
    if (migrateInStore(session, legacy, next)) sessionMoved += 1;
  }
  return { localMoved, sessionMoved };
}
