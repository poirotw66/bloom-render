/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tells a visitor without an API key why nothing will generate, before they
 * spend a minute finding out.
 *
 * Without a key every request fails in getClient(), and the only thing the page
 * used to say afterwards was "all generations failed" — true, but not the
 * reason and not something the user can act on. So say it up front, and put the
 * two things that fix it (open settings, get a key) right in the notice.
 */

import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { openSettingsPanel } from '../utils/settingsPanel';

/** Where a Gemini API key comes from. */
export const API_KEY_CONSOLE_URL = 'https://aistudio.google.com/apikey';

interface ApiKeyNoticeProps {
  className?: string;
}

const ApiKeyNotice: React.FC<ApiKeyNoticeProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const settings = useSettings();

  if (settings.apiKey.trim()) return null;

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-xl bg-amber-500/15 border border-amber-500/50 px-4 py-3 text-left ${className}`}
    >
      <p className="text-amber-200 text-sm font-bold">⚙️ {t('apikey.notice_title')}</p>
      <p className="text-amber-200/80 text-xs mt-1">{t('apikey.notice_hint')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openSettingsPanel}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-amber-400"
        >
          {t('apikey.open_settings')}
        </button>
        <a
          href={API_KEY_CONSOLE_URL}
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
