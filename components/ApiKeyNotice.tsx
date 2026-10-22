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
import { openSettingsPanel } from '../utils/settingsPanel';
import { CogIcon } from './icons';

/** Where a Gemini API key comes from. */
export const API_KEY_CONSOLE_URL = 'https://aistudio.google.com/apikey';
/** Where an OpenRouter API key comes from. */
export const OPENROUTER_KEY_CONSOLE_URL = 'https://openrouter.ai/keys';

interface ApiKeyNoticeProps {
  className?: string;
}

const ApiKeyNotice: React.FC<ApiKeyNoticeProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const settings = useSettings();

  // Demo mode needs no key; real keys hide the notice.
  if (settings.isDemoMode || settings.effectiveApiKey.trim()) return null;

  const isOpenRouter = settings.imageProvider === 'openrouter';
  const getKeyUrl = isOpenRouter ? OPENROUTER_KEY_CONSOLE_URL : API_KEY_CONSOLE_URL;

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-xl bg-amber-500/15 border border-amber-500/50 px-4 py-3 text-left ${className}`}
    >
      <p className="text-amber-200 text-sm font-bold inline-flex items-center gap-1.5">
        <CogIcon className="w-4 h-4 shrink-0" />
        {t('apikey.notice_title')}
      </p>
      <p className="text-amber-200/80 text-xs mt-1">
        {isOpenRouter ? t('apikey.notice_hint_openrouter') : t('apikey.notice_hint')}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => settings.enableDemoMode()}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-400 text-sky-950 hover:bg-sky-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-sky-300"
        >
          {t('demo.try_demo')}
        </button>
        <button
          type="button"
          onClick={openSettingsPanel}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-amber-400"
        >
          {t('apikey.open_settings')}
        </button>
        <a
          href={getKeyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-200 border border-amber-500/50 hover:bg-amber-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-amber-400"
        >
          {t('apikey.get_key')} ↗
        </a>
      </div>
    </div>
  );
};

export default ApiKeyNotice;
