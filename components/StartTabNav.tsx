/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Main navigation tabs: responsive, scrollable on mobile, theme-aware.
 * Narrow screens get edge fades + arrows so the strip doesn’t look clipped.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  | 'enhance'
  | 'restore';

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
    accentActive: 'bg-blue-700 text-white',
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
    accentActive: 'bg-emerald-700 text-white',
    accentFocus: 'focus-visible:ring-emerald-500',
  },
  {
    tab: 'portrait',
    path: ROUTES.PORTRAIT,
    i18nKey: 'start.tab_portrait',
    accentActive: 'bg-blue-700 text-white',
    accentFocus: 'focus-visible:ring-blue-500',
  },
  {
    tab: 'travel',
    path: ROUTES.TRAVEL,
    i18nKey: 'start.tab_travel',
    accentActive: 'bg-amber-700 text-white',
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
    accentActive: 'bg-pink-700 text-white',
    accentFocus: 'focus-visible:ring-pink-500',
  },
  {
    tab: 'tryon',
    path: ROUTES.TRY_ON,
    i18nKey: 'start.tab_tryon',
    accentActive: 'bg-teal-700 text-white',
    accentFocus: 'focus-visible:ring-teal-500',
  },
  {
    tab: 'enhance',
    path: ROUTES.ENHANCE,
    i18nKey: 'start.tab_enhance',
    accentActive: 'bg-cyan-700 text-white',
    accentFocus: 'focus-visible:ring-cyan-500',
  },
  {
    tab: 'restore',
    path: ROUTES.RESTORE,
    i18nKey: 'start.tab_restore',
    accentActive: 'bg-amber-800 text-white',
    accentFocus: 'focus-visible:ring-amber-500',
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
  bloom: 'from-[color:var(--bg-surface)]',
  night: 'from-gray-950',
  newyear: 'from-red-950',
};

const arrowByTheme: Record<ThemeType, string> = {
  bloom: 'theme-raised theme-ink border theme-border hover:brand-bg-tint focus-visible:brand-ring',
  night:
    'bg-gray-900 text-sky-100 border border-sky-500/40 hover:bg-sky-950 focus-visible:ring-sky-400',
  newyear:
    'bg-red-950 text-yellow-100 border border-yellow-500/40 hover:bg-red-900 focus-visible:ring-yellow-400',
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

const SCROLL_STEP = 160;

const StartTabNav: React.FC<StartTabNavProps> = ({ currentTab }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const { scrollLeft, scrollWidth, clientWidth } = scroller;
    const max = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(max > 2 && scrollLeft < max - 2);
  }, []);

  // On narrow screens the tab strip scrolls horizontally; keep the current tab
  // visible instead of leaving it off-screen after navigation or a reload.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;
    if (scroller.scrollWidth <= scroller.clientWidth) {
      updateScrollHints();
      return;
    }

    const target = active.offsetLeft - (scroller.clientWidth - active.clientWidth) / 2;
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    // Recompute after layout / smooth scroll settles.
    const id = window.setTimeout(updateScrollHints, 120);
    return () => window.clearTimeout(id);
  }, [currentTab, updateScrollHints]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateScrollHints();
    scroller.addEventListener('scroll', updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(scroller);
    window.addEventListener('resize', updateScrollHints);
    return () => {
      scroller.removeEventListener('scroll', updateScrollHints);
      ro.disconnect();
      window.removeEventListener('resize', updateScrollHints);
    };
  }, [updateScrollHints]);

  const scrollByDir = (dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: dir * SCROLL_STEP,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  return (
    <nav
      data-ui="primary-tabs"
      data-testid="start-tab-nav"
      className="w-full min-w-0 relative px-1 sm:px-0"
      aria-label="Primary"
    >
      <div
        ref={scrollerRef}
        className={`${trackByTheme[theme]} p-1.5 pl-3 pr-3 rounded-xl flex items-center gap-1.5 overflow-x-auto overflow-y-hidden md:flex-wrap md:justify-center md:overflow-visible scroll-smooth touch-pan-x no-scrollbar`}
        style={{ WebkitOverflowScrolling: 'touch' }}
        data-testid="start-tab-scroller"
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

      {/* Edge fades — only when more content exists in that direction (≤640px / non-wrapping). */}
      {canScrollLeft && (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-xl bg-gradient-to-r ${edgeFadeByTheme[theme]} to-transparent md:hidden`}
          aria-hidden="true"
          data-testid="tab-fade-left"
        />
      )}
      {canScrollRight && (
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l ${edgeFadeByTheme[theme]} to-transparent md:hidden`}
          aria-hidden="true"
          data-testid="tab-fade-right"
        />
      )}

      {canScrollLeft && (
        <button
          type="button"
          data-testid="tab-scroll-left"
          aria-label={t('nav.scroll_tabs_left')}
          onClick={() => scrollByDir(-1)}
          className={`md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow cursor-pointer focus:outline-none focus-visible:ring-2 ${arrowByTheme[theme]}`}
        >
          <svg
            viewBox="0 0 20 20"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4 6 10l6 6" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          data-testid="tab-scroll-right"
          aria-label={t('nav.scroll_tabs_right')}
          onClick={() => scrollByDir(1)}
          className={`md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow cursor-pointer focus:outline-none focus-visible:ring-2 ${arrowByTheme[theme]}`}
        >
          <svg
            viewBox="0 0 20 20"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4l6 6-6 6" />
          </svg>
        </button>
      )}
    </nav>
  );
};

export default StartTabNav;
