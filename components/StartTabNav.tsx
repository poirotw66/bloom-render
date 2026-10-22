/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Main navigation tabs: responsive, scrollable on mobile, theme-aware.
 */

import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { ROUTES } from '../constants/routes';

export type StartTab =
  | 'upload'
  | 'generate'
  | 'idphoto'
  | 'portrait'
  | 'travel'
  | 'themed'
  | 'photography-service'
  | 'couple-group'
  | 'tryon'
  | 'enhance';

interface TabItem {
  tab: StartTab;
  path: string;
  i18nKey: string;
  /** Feature accent when theme is bloom/night; New Year overrides to red/gold. */
  accentActive: string;
  accentFocus: string;
}

interface StartTabNavProps {
  currentTab: StartTab;
}

const tabs: TabItem[] = [
  {
    tab: 'upload',
    path: ROUTES.HOME,
    i18nKey: 'start.tab_upload',
    accentActive: 'bg-gray-700 text-white',
    accentFocus: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'generate',
    path: ROUTES.GENERATE,
    i18nKey: 'start.tab_generate',
    accentActive: 'bg-blue-600 text-white',
    accentFocus: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'photography-service',
    path: ROUTES.PHOTOGRAPHY_SERVICE,
    i18nKey: 'start.tab_service',
    accentActive: 'brand-bg-strong text-white',
    accentFocus: 'focus-visible:brand-ring',
  },
  {
    tab: 'idphoto',
    path: ROUTES.ID_PHOTO,
    i18nKey: 'start.tab_idphoto',
    accentActive: 'bg-emerald-600 text-white',
    accentFocus: 'focus-visible:ring-emerald-500',
  },
  {
    tab: 'portrait',
    path: ROUTES.PORTRAIT,
    i18nKey: 'start.tab_portrait',
    accentActive: 'bg-blue-600 text-white',
    accentFocus: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'travel',
    path: ROUTES.TRAVEL,
    i18nKey: 'start.tab_travel',
    accentActive: 'bg-amber-600 text-white',
    accentFocus: 'focus-visible:ring-amber-500',
  },
  {
    tab: 'themed',
    path: ROUTES.THEMED,
    i18nKey: 'start.tab_themed',
    accentActive: 'brand-bg-strong text-white',
    accentFocus: 'focus-visible:brand-ring',
  },
  {
    tab: 'couple-group',
    path: ROUTES.COUPLE_GROUP,
    i18nKey: 'start.tab_couple_group',
    accentActive: 'bg-pink-600 text-white',
    accentFocus: 'focus-visible:ring-pink-500',
  },
  {
    tab: 'tryon',
    path: ROUTES.TRY_ON,
    i18nKey: 'start.tab_tryon',
    accentActive: 'bg-teal-600 text-white',
    accentFocus: 'focus-visible:ring-teal-500',
  },
  {
    tab: 'enhance',
    path: ROUTES.ENHANCE,
    i18nKey: 'start.tab_enhance',
    accentActive: 'bg-cyan-600 text-white',
    accentFocus: 'focus-visible:ring-cyan-500',
  },
];

const trackByTheme: Record<ThemeType, string> = {
  bloom: 'theme-nav-track border theme-border',
  night: 'theme-nav-track border theme-border',
  newyear: 'theme-nav-track border theme-border',
};

const idleByTheme: Record<ThemeType, string> = {
  bloom: 'theme-ink-soft hover:text-white hover:brand-bg-tint',
  night: 'text-gray-300 hover:text-white hover:bg-white/10',
  newyear: 'text-red-100 hover:text-yellow-200 hover:bg-red-800/40',
};

const edgeFadeByTheme: Record<ThemeType, string> = {
  bloom: 'bg-[color:var(--bg-surface)]/90',
  night: 'bg-gray-950/80',
  newyear: 'bg-red-950/90',
};

function activeClasses(theme: ThemeType, tab: TabItem): { active: string; focus: string } {
  if (theme === 'newyear') {
    return {
      active: 'bg-red-600 text-yellow-100',
      focus: 'focus-visible:ring-yellow-400',
    };
  }
  if (theme === 'bloom' && tab.tab === 'upload') {
    return { active: 'brand-bg text-white', focus: 'focus-visible:brand-ring' };
  }
  return { active: tab.accentActive, focus: tab.accentFocus };
}

const StartTabNav: React.FC<StartTabNavProps> = ({ currentTab }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On narrow screens the tab strip scrolls horizontally; keep the current tab
  // visible instead of leaving it off-screen after navigation or a reload.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;

    const target = active.offsetLeft - (scroller.clientWidth - active.clientWidth) / 2;
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [currentTab]);

  return (
    <nav className="w-full min-w-0 relative" aria-label="Primary">
      <div
        ref={scrollerRef}
        className={`${trackByTheme[theme]} p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto overflow-y-hidden md:flex-wrap md:justify-center md:overflow-visible scroll-smooth touch-pan-x no-scrollbar`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((item) => {
          const isActive = currentTab === item.tab;
          const { active, focus } = activeClasses(theme, item);

          return (
            <NavLink
              key={item.tab}
              to={item.path}
              ref={isActive ? activeRef : undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                // The editor holds its undo stack in memory; leaving discards it.
                if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) {
                  event.preventDefault();
                }
              }}
              className={`
                px-4 py-3 min-h-[44px] rounded-lg text-base font-semibold
                inline-flex items-center whitespace-nowrap
                transition-colors duration-200 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-offset-[color:var(--bg-main)] ${focus}
                shrink-0
                ${isActive ? active : idleByTheme[theme]}
              `}
            >
              {t(item.i18nKey)}
            </NavLink>
          );
        })}
      </div>

      {/* Edge fade hints that the strip scrolls horizontally on narrow screens. */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl ${edgeFadeByTheme[theme]} md:hidden`}
        aria-hidden="true"
      />
    </nav>
  );
};

export default StartTabNav;
