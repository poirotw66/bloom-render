/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Prompt when a new service-worker version is waiting.
 */

import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_BTN_PRIMARY, UI_BTN_SECONDARY } from '../utils/uiClasses';

const PwaUpdatePrompt: React.FC = () => {
  const { t } = useLanguage();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW() {
      // Registration succeeded — offline shell is available after first visit.
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-gray-600 bg-gray-900/95 p-4 shadow-2xl backdrop-blur"
      role="status"
    >
      <p className="text-sm text-gray-100 mb-3">{t('pwa.update_available')}</p>
      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" className={UI_BTN_SECONDARY} onClick={() => setNeedRefresh(false)}>
          {t('pwa.update_dismiss')}
        </button>
        <button
          type="button"
          className={UI_BTN_PRIMARY}
          onClick={() => void updateServiceWorker(true)}
        >
          {t('pwa.update_reload')}
        </button>
      </div>
    </div>
  );
};

export default PwaUpdatePrompt;
