/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Visible demo-mode strip: badge + CTA to add a real API key in Settings.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { openSettingsPanel } from '../utils/settingsPanel';

interface DemoModeBannerProps {
  className?: string;
  /** Compact badge-only layout for overlaying result images. */
  compact?: boolean;
}

const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ className = '', compact = false }) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();

  if (!isDemoMode) return null;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-sky-500/90 px-2 py-0.5 text-xs font-semibold text-white ${className}`}
        data-testid="demo-result-label"
      >
        {t('demo.result_label')}
      </span>
    );
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-xl bg-sky-950 px-4 py-3 text-left ${className}`}
      role="status"
    >
      <p className="text-sky-100 text-base font-semibold">
        <span className="inline-flex items-center rounded-md bg-sky-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white mr-2">
          {t('demo.badge')}
        </span>
        {t('demo.banner_title')}
      </p>
      <p className="text-sky-100/80 text-xs mt-1">{t('demo.banner_hint')}</p>
      <button
        type="button"
        onClick={openSettingsPanel}
        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-400 text-sky-950 hover:bg-sky-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-sky-300"
      >
        {t('demo.cta_settings')}
      </button>
    </div>
  );
};

export default DemoModeBanner;
