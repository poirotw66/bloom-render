/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main navigation tabs: responsive, scrollable on mobile, theme-aware.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { ThemeType } from '../contexts/ThemeContext';

export type StartTab = 'upload' | 'generate' | 'idphoto' | 'portrait' | 'travel' | 'themed' | 'photography-service' | 'couple-group' | 'tryon';

interface TabItem {
  tab: StartTab;
  path: string;
  i18nKey: string;
  activeClass: string;
  focusRing: string;
}

interface StartTabNavProps {
  currentTab: StartTab;
  navigate: (path: string) => void;
  theme?: ThemeType;
}

const tabs: TabItem[] = [
  { tab: 'photography-service', path: '/photography-service', i18nKey: 'start.tab_service', activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20', focusRing: 'focus:ring-indigo-500' },
  { tab: 'upload', path: '/', i18nKey: 'start.tab_upload', activeClass: 'bg-gray-700 text-white shadow-lg', focusRing: 'focus:ring-blue-500' },
  { tab: 'generate', path: '/generate', i18nKey: 'start.tab_generate', activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20', focusRing: 'focus:ring-blue-500' },
  { tab: 'idphoto', path: '/idphoto', i18nKey: 'start.tab_idphoto', activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20', focusRing: 'focus:ring-emerald-500' },
  { tab: 'portrait', path: '/portrait', i18nKey: 'start.tab_portrait', activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20', focusRing: 'focus:ring-blue-500' },
  { tab: 'travel', path: '/travel', i18nKey: 'start.tab_travel', activeClass: 'bg-amber-600 text-white shadow-lg shadow-amber-500/20', focusRing: 'focus:ring-amber-500' },
  { tab: 'themed', path: '/themed', i18nKey: 'start.tab_themed', activeClass: 'bg-purple-600 text-white shadow-lg shadow-purple-500/20', focusRing: 'focus:ring-purple-500' },
  { tab: 'couple-group', path: '/couple-group', i18nKey: 'start.tab_couple_group', activeClass: 'bg-pink-600 text-white shadow-lg shadow-pink-500/20', focusRing: 'focus:ring-pink-500' },
  { tab: 'tryon', path: '/try-on', i18nKey: 'start.tab_tryon', activeClass: 'bg-teal-600 text-white shadow-lg shadow-teal-500/20', focusRing: 'focus:ring-teal-500' },
];

const StartTabNav: React.FC<StartTabNavProps> = ({ currentTab, navigate, theme }) => {
  const { t } = useLanguage();
  const focusRingOffset = 'focus:ring-offset-2';

  return (
    <nav
      className="w-full min-w-0"
      aria-label="Primary"
    >
      <div
        className="bg-gray-900/40 p-1.5 rounded-xl border border-gray-700/60 shadow-inner flex items-center gap-1.5 overflow-x-auto overflow-y-hidden md:flex-wrap md:justify-center md:overflow-visible scroll-smooth touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map(({ tab, path, i18nKey, activeClass, focusRing }) => (
          <button
            key={tab}
            type="button"
            onClick={() => navigate(path)}
            aria-current={currentTab === tab ? 'page' : undefined}
            className={`
              px-4 py-3 min-h-[44px] rounded-lg text-sm sm:text-base font-semibold
              transition-colors duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRingOffset} ${focusRing}
              shrink-0
              ${currentTab === tab ? activeClass : 'text-gray-400 hover:text-white hover:bg-white/10'}
            `}
          >
            {t(i18nKey)}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default StartTabNav;
