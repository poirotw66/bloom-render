/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mobile sticky “免金鑰試玩 / Try demo” — visible in the first viewport when
 * the visitor has no key, hidden once demo/key is active or the footer is in view.
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';

const btnByTheme: Record<ThemeType, string> = {
  bloom: 'brand-bg-strong text-white hover:opacity-95 focus-visible:brand-ring',
  night: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-400',
  newyear: 'bg-red-700 text-yellow-50 hover:bg-red-600 focus-visible:ring-yellow-400',
};

const StickyDemoCta: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isDemoMode, effectiveApiKey, enableDemoMode } = useSettings();
  const [footerVisible, setFooterVisible] = useState(false);

  const hasKey = Boolean(effectiveApiKey.trim()) || isDemoMode;

  useEffect(() => {
    if (hasKey) return;
    const footer = document.querySelector('[data-testid="site-footer"]');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterVisible(Boolean(entry?.isIntersecting));
      },
      { root: null, threshold: 0.15 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [hasKey]);

  if (hasKey || footerVisible) return null;

  return (
    <div
      data-testid="sticky-demo-cta"
      className="fixed inset-x-0 bottom-0 z-40 max-[640px]:flex min-[641px]:hidden pointer-events-none justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <button
        type="button"
        data-testid="sticky-try-demo-button"
        onClick={() => enableDemoMode()}
        className={`pointer-events-auto w-full max-w-md rounded-2xl px-5 py-3.5 text-base font-bold shadow-lg border theme-border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] ${btnByTheme[theme]}`}
      >
        {t('demo.sticky_try_demo')}
      </button>
    </div>
  );
};

export default StickyDemoCta;
