/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_TITLE, UI_SUBTITLE } from '../utils/uiClasses';
import ApiKeyNotice from './ApiKeyNotice';
import DemoModeBanner from './DemoModeBanner';

export default function StartScreenIntro() {
  const { t, language } = useLanguage();
  const location = useLocation();
  return (
    <>
      <header className="w-full space-y-2">
        <h1 className={UI_TITLE}>{t('start.tab_generate')}</h1>
        <p className={UI_SUBTITLE}>
          {language === 'zh-TW'
            ? '描述想要的畫面，可加入參考圖，再選擇比例與張數。'
            : 'Describe your image, add optional references, then choose a ratio and image count.'}
        </p>
      </header>
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
