/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * BYOK API key storage. Default: sessionStorage only (tab-scoped).
 * Opt-in “Remember key on this device” also mirrors keys into localStorage.
 */

export const GEMINI_API_KEY_STORAGE_KEY = 'bloom_api_key';
export const OPENROUTER_API_KEY_STORAGE_KEY = 'bloom_openrouter_api_key';
export const REMEMBER_API_KEY_STORAGE_KEY = 'bloom_remember_api_key';

/** @deprecated Use GEMINI_API_KEY_STORAGE_KEY; kept for migration tests. */
export const LEGACY_GEMINI_API_KEY_STORAGE_KEY = 'pixshop_api_key';
/** @deprecated Use OPENROUTER_API_KEY_STORAGE_KEY. */
export const LEGACY_OPENROUTER_API_KEY_STORAGE_KEY = 'pixshop_openrouter_api_key';

export type ApiKeyKind = 'gemini' | 'openrouter';

function storageKeyFor(kind: ApiKeyKind): string {
  return kind === 'openrouter' ? OPENROUTER_API_KEY_STORAGE_KEY : GEMINI_API_KEY_STORAGE_KEY;
}

export function isRememberApiKeyEnabled(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    return storage.getItem(REMEMBER_API_KEY_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggle persistent key storage. When disabled, wipe any localStorage copies
 * of Gemini / OpenRouter keys (sessionStorage values are kept).
 */
export function setRememberApiKeyEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(REMEMBER_API_KEY_STORAGE_KEY, 'true');
      // Mirror whatever is currently in the session so a refresh keeps working.
      for (const kind of ['gemini', 'openrouter'] as const) {
        const value = sessionStorage.getItem(storageKeyFor(kind));
        if (value) localStorage.setItem(storageKeyFor(kind), value);
      }
    } else {
      localStorage.setItem(REMEMBER_API_KEY_STORAGE_KEY, 'false');
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
      localStorage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Load keys for boot: session first; when remember is on, fill from localStorage
 * into session. When remember is off, strip any leftover local copies.
 */
export function hydrateApiKeys(): { gemini: string; openrouter: string } {
  const remember = isRememberApiKeyEnabled();
  const out = { gemini: '', openrouter: '' as string };

  for (const kind of ['gemini', 'openrouter'] as const) {
    const key = storageKeyFor(kind);
    let sessionVal = '';
    try {
      sessionVal = sessionStorage.getItem(key) ?? '';
    } catch {
      sessionVal = '';
    }
    let localVal = '';
    try {
      localVal = localStorage.getItem(key) ?? '';
    } catch {
      localVal = '';
    }

    if (remember) {
      const value = sessionVal || localVal;
      if (value) {
        try {
          sessionStorage.setItem(key, value);
          localStorage.setItem(key, value);
        } catch {
          /* ignore */
        }
      }
      out[kind] = value;
    } else {
      if (localVal) {
        try {
          localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
        if (!sessionVal) {
          try {
            sessionStorage.setItem(key, localVal);
          } catch {
            /* ignore */
          }
          sessionVal = localVal;
        }
      }
      out[kind] = sessionVal;
    }
  }

  return out;
}

/** @deprecated Prefer hydrateApiKeys — kept for older call sites/tests. */
export function migrateApiKeyFromLocalStorage(kind: ApiKeyKind): string {
  const hydrated = hydrateApiKeys();
  return hydrated[kind];
}

/** @deprecated Prefer hydrateApiKeys. */
export function migrateAllApiKeysFromLocalStorage(): {
  gemini: string;
  openrouter: string;
} {
  return hydrateApiKeys();
}

export function readApiKey(kind: ApiKeyKind): string {
  try {
    return sessionStorage.getItem(storageKeyFor(kind)) ?? '';
  } catch {
    return '';
  }
}

export function writeApiKey(kind: ApiKeyKind, value: string): void {
  const key = storageKeyFor(kind);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  try {
    if (isRememberApiKeyEnabled()) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function clearApiKey(kind: ApiKeyKind): void {
  const key = storageKeyFor(kind);
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
