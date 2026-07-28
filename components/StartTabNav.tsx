/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main navigation tabs: responsive, scrollable on mobile, theme-aware.
 */

import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
  | 'tryon';

interface TabItem {
  tab: StartTab;
  path: string;
  i18nKey: string;
  activeClass: string;
  focusRing: string;
}

interface StartTabNavProps {
  currentTab: StartTab;
}

const tabs: TabItem[] = [
  {
    tab: 'upload',
    path: ROUTES.HOME,
    i18nKey: 'start.tab_upload',
    activeClass: 'bg-gray-700 text-white shadow-lg',
    focusRing: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'generate',
    path: ROUTES.GENERATE,
    i18nKey: 'start.tab_generate',
    activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    focusRing: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'photography-service',
    path: ROUTES.PHOTOGRAPHY_SERVICE,
    i18nKey: 'start.tab_service',
    activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
    focusRing: 'focus-visible:ring-indigo-500',
  },
  {
    tab: 'idphoto',
    path: ROUTES.ID_PHOTO,
    i18nKey: 'start.tab_idphoto',
    activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    focusRing: 'focus-visible:ring-emerald-500',
  },
  {
    tab: 'portrait',
    path: ROUTES.PORTRAIT,
    i18nKey: 'start.tab_portrait',
    activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    focusRing: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'travel',
    path: ROUTES.TRAVEL,
    i18nKey: 'start.tab_travel',
    activeClass: 'bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    focusRing: 'focus-visible:ring-amber-500',
  },
  {
    tab: 'themed',
    path: ROUTES.THEMED,
    i18nKey: 'start.tab_themed',
    activeClass: 'bg-purple-600 text-white shadow-lg shadow-purple-500/20',
    focusRing: 'focus-visible:ring-purple-500',
  },
  {
    tab: 'couple-group',
    path: ROUTES.COUPLE_GROUP,
    i18nKey: 'start.tab_couple_group',
    activeClass: 'bg-pink-600 text-white shadow-lg shadow-pink-500/20',
    focusRing: 'focus-visible:ring-pink-500',
  },
  {
    tab: 'tryon',
    path: ROUTES.TRY_ON,
    i18nKey: 'start.tab_tryon',
    activeClass: 'bg-teal-600 text-white shadow-lg shadow-teal-500/20',
    focusRing: 'focus-visible:ring-teal-500',
  },
];

const StartTabNav: React.FC<StartTabNavProps> = ({ currentTab }) => {
  const { t } = useLanguage();
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
        className="bg-gray-900/40 p-1.5 rounded-xl border border-gray-700/60 shadow-inner flex items-center gap-1.5 overflow-x-auto overflow-y-hidden md:flex-wrap md:justify-center md:overflow-visible scroll-smooth touch-pan-x no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map(({ tab, path, i18nKey, activeClass, focusRing }) => {
          const isActive = currentTab === tab;

          return (
            <NavLink
              key={tab}
              to={path}
              ref={isActive ? activeRef : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`
                px-4 py-3 min-h-[44px] rounded-lg text-sm sm:text-base font-semibold
                inline-flex items-center whitespace-nowrap
                transition-colors duration-200 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-offset-gray-900 ${focusRing}
                shrink-0
                ${isActive ? activeClass : 'text-gray-400 hover:text-white hover:bg-white/10'}
              `}
            >
              {t(i18nKey)}
            </NavLink>
          );
        })}
      </div>

      {/* Edge fade hints that the strip scrolls horizontally on narrow screens. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-gradient-to-l from-gray-900/70 to-transparent md:hidden"
        aria-hidden="true"
      />
    </nav>
  );
};

export default StartTabNav;
