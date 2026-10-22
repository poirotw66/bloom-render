/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Tells a visitor without an API key why nothing will generate, before they
 * spend a minute finding out — and offers offline demo mode.
 */

import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';
import { openSettingsPanel } from '../utils/settingsPanel';
import { CogIcon } from './icons';
import OpenRouterSignInButton from './OpenRouterSignInButton';

/** Where a Gemini API key comes from. */
export const API_KEY_CONSOLE_URL = 'https://aistudio.google.com/apikey';
/** Where an OpenRouter API key comes from. */
export const OPENROUTER_KEY_CONSOLE_URL = 'https://openrouter.ai/keys';

interface ApiKeyNoticeProps {
  className?: string;
}

const noticeShell: Record<ThemeType, string> = {
  bloom: 'bg-[color:var(--notice-bg)] border theme-border',
  night: 'bg-[color:var(--notice-bg)] border theme-border',
  newyear: 'bg-[color:var(--notice-bg)] border theme-border',
};

const noticeTitle: Record<ThemeType, string> = {
  bloom: 'text-[color:var(--notice-ink)]',
  night: 'text-[color:var(--notice-ink)]',
  newyear: 'text-yellow-200',
};

const noticeBody: Record<ThemeType, string> = {
  bloom: 'text-[color:var(--notice-ink)]/90',
  night: 'text-[color:var(--notice-ink)]/90',
  newyear: 'text-red-100',
};

const btnDemo: Record<ThemeType, string> = {
  bloom: 'bg-pink-400 text-pink-950 hover:bg-pink-300 focus-visible:ring-pink-300',
  night: 'bg-sky-400 text-sky-950 hover:bg-sky-300 focus-visible:ring-sky-300',
  newyear: 'bg-yellow-400 text-red-950 hover:bg-yellow-300 focus-visible:ring-yellow-300',
};

const btnSettings: Record<ThemeType, string> = {
  bloom: 'brand-bg text-white hover:opacity-95 focus-visible:brand-ring',
  night: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-400',
  newyear: 'bg-red-600 text-yellow-100 hover:bg-red-500 focus-visible:ring-yellow-400',
};

const btnGetKey: Record<ThemeType, string> = {
  bloom: 'theme-ink border theme-border-strong hover:brand-bg-tint focus-visible:brand-ring',
  night: 'text-sky-100 border border-sky-400/50 hover:bg-sky-900/50 focus-visible:ring-sky-300',
  newyear:
    'text-yellow-100 border border-yellow-400/50 hover:bg-red-800/50 focus-visible:ring-yellow-400',
};

const ApiKeyNotice: React.FC<ApiKeyNoticeProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();

  // Demo mode needs no key; real keys hide the notice.
  if (settings.isDemoMode || settings.effectiveApiKey.trim()) return null;

  const isOpenRouter = settings.imageProvider === 'openrouter';
  const getKeyUrl = isOpenRouter ? OPENROUTER_KEY_CONSOLE_URL : API_KEY_CONSOLE_URL;

  return (
    <div
      data-testid="api-key-notice"
      className={`w-full max-w-2xl mx-auto rounded-xl px-4 py-3 text-left border ${noticeShell[theme]} ${className}`}
    >
      <p
        className={`text-base font-semibold inline-flex items-center gap-1.5 ${noticeTitle[theme]}`}
      >
        <CogIcon className="w-4 h-4 shrink-0" />
        {t('apikey.notice_title')}
      </p>
      <p className={`text-base mt-1 ${noticeBody[theme]}`}>
        {isOpenRouter ? t('apikey.notice_hint_openrouter') : t('apikey.notice_hint')}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OpenRouterSignInButton compact />
        <button
          type="button"
          data-testid="try-demo-button"
          onClick={() => settings.enableDemoMode()}
          className={`px-3 py-1.5 rounded-lg text-base font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] ${btnDemo[theme]}`}
        >
          {t('demo.try_demo')}
        </button>
        <button
          type="button"
          onClick={openSettingsPanel}
          className={`px-3 py-1.5 rounded-lg text-base font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] ${btnSettings[theme]}`}
        >
          {t('apikey.open_settings')}
        </button>
        <a
          href={getKeyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={`px-3 py-1.5 rounded-lg text-base font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] ${btnGetKey[theme]}`}
        >
          {t('apikey.get_key')}
        </a>
      </div>
    </div>
  );
};

export default ApiKeyNotice;
