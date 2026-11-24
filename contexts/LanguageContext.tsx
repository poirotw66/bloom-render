/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  getLoadedMessages,
  loadMessages,
  type Language,
  type Messages,
} from '../locales/loadMessages';

export type { Language } from '../locales/loadMessages';

export const STORAGE_KEY_LANGUAGE = 'bloom_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
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
  const [active, setActive] = useState<{ language: Language; messages?: Messages }>(() => {
    const language = getInitialLanguage();
    return { language, messages: getLoadedMessages(language) };
  });
  const [loadError, setLoadError] = useState(false);
  const requestedLanguage = useRef(active.language);
  const requestId = useRef(0);
  const language = active.language;

  const setLanguage = useCallback((lang: Language) => {
    requestedLanguage.current = lang;
    const current = ++requestId.current;
    setLoadError(false);
    const commit = (messages: Messages) => {
      if (requestId.current !== current) return;
      setActive({ language: lang, messages });
      try {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
      } catch {
        /* private mode */
      }
    };
    const cached = getLoadedMessages(lang);
    if (cached) {
      commit(cached);
      return;
    }
    void loadMessages(lang).then(commit, () => {
      if (requestId.current === current) setLoadError(true);
    });
  }, []);

  useEffect(() => {
    if (!active.messages) setLanguage(requestedLanguage.current);
    return () => {
      requestId.current += 1;
    };
  }, [active.messages, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language === 'zh-TW' ? 'zh-TW' : 'en';
  }, [language]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = active.messages?.[key] || key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [active.messages],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  // Switching keeps the previous dictionary visible; the initial load shows a neutral shell.
  const errorLabel =
    language === 'zh-TW' ? '無法載入語言，請重試。' : 'Unable to load language. Please retry.';
  const retryLabel = language === 'zh-TW' ? '重試' : 'Retry';
  if (!active.messages) {
    return (
      <div
        role={loadError ? 'alert' : 'status'}
        className="min-h-svh flex items-center justify-center gap-3 theme-ink"
      >
        {loadError ? errorLabel : 'BloomRender…'}
        {loadError && (
          <button type="button" onClick={() => setLanguage(requestedLanguage.current)}>
            {retryLabel}
          </button>
        )}
      </div>
    );
  }
  return (
    <LanguageContext.Provider value={value}>
      {loadError && (
        <div role="alert" className="p-3 text-center theme-ink">
          {errorLabel}{' '}
          <button type="button" onClick={() => setLanguage(requestedLanguage.current)}>
            {retryLabel}
          </button>
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
