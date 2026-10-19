/**
 * BYOK API key storage: sessionStorage only (tab-scoped).
 * Non-secret prefs (provider, model, theme, …) stay in localStorage via SettingsContext.
 */

export const GEMINI_API_KEY_STORAGE_KEY = 'pixshop_api_key';
export const OPENROUTER_API_KEY_STORAGE_KEY = 'pixshop_openrouter_api_key';

export type ApiKeyKind = 'gemini' | 'openrouter';

function storageKeyFor(kind: ApiKeyKind): string {
  return kind === 'openrouter' ? OPENROUTER_API_KEY_STORAGE_KEY : GEMINI_API_KEY_STORAGE_KEY;
}

/**
 * One-time migration: if a key still lives in localStorage, move it to
 * sessionStorage and delete the localStorage copy so nothing sensitive remains.
 * Prefer an existing sessionStorage value when both are present.
 */
export function migrateApiKeyFromLocalStorage(kind: ApiKeyKind): string {
  const key = storageKeyFor(kind);
  const fromSession = sessionStorage.getItem(key);
  const fromLocal = localStorage.getItem(key);

  if (fromLocal !== null) {
    localStorage.removeItem(key);
    if (fromSession === null || fromSession === '') {
      sessionStorage.setItem(key, fromLocal);
      return fromLocal;
    }
  }

  return fromSession ?? '';
}

/** Migrate both Gemini and OpenRouter keys. Returns the values after migration. */
export function migrateAllApiKeysFromLocalStorage(): {
  gemini: string;
  openrouter: string;
} {
  return {
    gemini: migrateApiKeyFromLocalStorage('gemini'),
    openrouter: migrateApiKeyFromLocalStorage('openrouter'),
  };
}

export function readApiKey(kind: ApiKeyKind): string {
  return sessionStorage.getItem(storageKeyFor(kind)) ?? '';
}

export function writeApiKey(kind: ApiKeyKind, value: string): void {
  const key = storageKeyFor(kind);
  sessionStorage.setItem(key, value);
  // Ensure no leftover localStorage copy after an older build wrote there.
  localStorage.removeItem(key);
}

export function clearApiKey(kind: ApiKeyKind): void {
  const key = storageKeyFor(kind);
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}
