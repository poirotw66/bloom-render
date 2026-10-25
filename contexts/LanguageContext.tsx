/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Locales load on demand (one language chunk). Default language resolves
 * synchronously from storage/browser, then that locale module is fetched
 * before painting translated UI — avoids shipping both en + zh-TW in the
 * homepage entry and reduces flash of the wrong language.
 */

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

export type Language = 'en' | 'zh-TW';

export const STORAGE_KEY_LANGUAGE = 'bloom_language';

type Messages = Record<string, string>;

const localeLoaders: Record<Language, () => Promise<Messages>> = {
  en: () => import('../locales/en').then((m) => m.enMessages),
  'zh-TW': () => import('../locales/zh-TW').then((m) => m.zhTWMessages),
};

const messageCache = new Map<Language, Messages>();

export function loadLocaleMessages(lang: Language): Promise<Messages> {
  const cached = messageCache.get(lang);
  if (cached) return Promise.resolve(cached);
  return localeLoaders[lang]().then((messages) => {
    messageCache.set(lang, messages);
    return messages;
  });
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** False until the active locale module has loaded. */
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function interpolate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\s*${k}\\s*\\}`, 'g'), String(v));
  }
  return out;
}

/** Map browser / stored locale tags to an app language. */
export function resolveLanguage(input: string | null | undefined): Language | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (
    normalized === 'zh' ||
    normalized === 'zh-tw' ||
    normalized === 'zh-hant' ||
    normalized.startsWith('zh-')
  ) {
    return 'zh-TW';
  }
  return null;
}

/** First visit: zh-* → zh-TW, otherwise English. */
export function detectBrowserLanguage(
  languages: readonly string[] = typeof navigator !== 'undefined' ? navigator.languages : [],
  language: string = typeof navigator !== 'undefined' ? navigator.language : 'en',
): Language {
  for (const tag of languages.length > 0 ? languages : [language]) {
    const resolved = resolveLanguage(tag);
    if (resolved) return resolved;
  }
  return resolveLanguage(language) ?? 'en';
}

export function readStoredLanguage(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): Language | null {
  if (!storage) return null;
  try {
    return resolveLanguage(storage.getItem(STORAGE_KEY_LANGUAGE));
  } catch {
    return null;
  }
}

export function getInitialLanguage(): Language {
  return readStoredLanguage() ?? detectBrowserLanguage();
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());
  const [messages, setMessages] = useState<Messages | null>(
    () => messageCache.get(getInitialLanguage()) ?? null,
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh-TW' ? 'zh-TW' : 'en';
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    const cached = messageCache.get(language);
    if (cached) {
      setMessages(cached);
      return;
    }
    setMessages(null);
    void loadLocaleMessages(language).then((loaded) => {
      if (!cancelled) setMessages(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (!messages) return key;
      const raw = messages[key] || key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [messages],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, ready: Boolean(messages) }),
    [language, setLanguage, t, messages],
  );

  // Theme-colored shell while the locale chunk loads (no white flash).
  if (!messages) {
    return (
      <div
        className="min-h-svh w-full theme-bg"
        data-testid="locale-loading"
        aria-busy="true"
        aria-live="polite"
      />
    );
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
