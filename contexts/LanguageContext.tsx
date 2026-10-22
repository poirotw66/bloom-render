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
} from 'react';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';

export type Language = 'en' | 'zh-TW';

export const STORAGE_KEY_LANGUAGE = 'pixshop_language';

const translations: Record<Language, Record<string, string>> = {
  en: enMessages,
  'zh-TW': zhTWMessages,
};

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
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

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

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = translations[language][key] || key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
