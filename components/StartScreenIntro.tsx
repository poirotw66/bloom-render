/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { UI_TITLE, UI_SUBTITLE } from '../utils/uiClasses';
import ApiKeyNotice from './ApiKeyNotice';
import DemoModeBanner from './DemoModeBanner';
import ExampleShowcase from './ExampleShowcase';
import { themeStyles } from './startScreenStyles';

export default function StartScreenIntro({ showHero = false }: { showHero?: boolean }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();
  const s = themeStyles[theme];
  return (
    <>
      <img
        src={`${import.meta.env.BASE_URL}logo/bloomrender_bg.png`}
        alt=""
        className="w-24 h-24 max-[640px]:w-14 max-[640px]:h-14 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-"
        aria-hidden="true"
      />
      <h1 className={`${UI_TITLE} max-[640px]:text-2xl`}>
        {t('start.title_part1')} <span className={s.titleAccent}>{t('start.title_part2')}</span>.
      </h1>
      <p
        className={`text-base md:text-lg ${s.slogan} font-medium italic mt-1 max-[640px]:text-sm max-[640px]:mt-0`}
      >
        {t('app.slogan')}
      </p>
      {/* On narrow phones, skip the long subtitle so the before/after can sit
            in the first viewport (Wave Q / A5). */}
      <p className={`${UI_SUBTITLE} max-[640px]:hidden`}>{t('start.subtitle')}</p>

      {/* Mobile first viewport: show a real before/after result immediately
            (≤640px). Desktop keeps the fuller showcase below the fold. */}
      {showHero && (
        <div className="w-full max-[640px]:block min-[641px]:hidden">
          <ExampleShowcase feature="editor" variant="hero" autoPlay className="mt-0" />
        </div>
      )}

      {/* No-key visitors need the API notice in the first viewport, before the
            gallery pushes it below the fold. */}
      <ApiKeyNotice />
      <DemoModeBanner />

      {(location.state as { remixReady?: boolean } | null)?.remixReady && (
        <p
          className="w-full max-w-2xl text-sm theme-ink rounded-xl border theme-border theme-raised px-4 py-3"
          role="status"
          data-testid="remix-ready-banner"
        >
          {t('viral.remix_ready')}
        </p>
      )}
    </>
  );
}
