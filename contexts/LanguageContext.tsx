/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';

type Language = 'en' | 'zh-TW';

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
    out = out.replace(new RegExp(`\{\s*${k}\s*\}`, 'g'), String(v));
  }
  return out;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = translations[language][key] || key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
