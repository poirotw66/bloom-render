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

const StickyDemoCta: React.FC = () => {
  const { t } = useLanguage();
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
        className="tool-button tool-button-primary pointer-events-auto w-full max-w-md"
      >
        {t('demo.sticky_try_demo')}
      </button>
    </div>
  );
};

export default StickyDemoCta;
