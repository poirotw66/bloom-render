/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Generic result display component for generate pages.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import DemoModeBanner from './DemoModeBanner';
import ResultActions from './ResultActions';
import ResultImage from './ResultImage';
import { UI_BTN_PRIMARY, UI_BTN_SECONDARY, UI_CARD } from '../utils/uiClasses';

interface GenericResultProps {
  result: string;
  /** Input / before image URL for compare + branded cards. */
  originalUrl?: string | null;
  onAgain: () => void;
  onEditInEditor?: () => void;
  paramsTitleKey?: string;
  params?: Array<{ labelKey: string; value: string | React.ReactNode }>;
  editKey?: string;
  againKey?: string;
  fileBaseName?: string;
  className?: string;
}

const GenericResult: React.FC<GenericResultProps> = ({
  result,
  originalUrl,
  onAgain,
  onEditInEditor,
  paramsTitleKey,
  params = [],
  editKey = 'start.idphoto_edit',
  againKey = 'start.idphoto_again',
  fileBaseName = 'bloomrender-result',
  className = '',
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();

  return (
    <div className={`flex flex-col items-center gap-6 w-full max-w-2xl mx-auto ${className}`}>
      {isDemoMode && <DemoModeBanner />}
      <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 p-2 bg-gray-950/40">
        {isDemoMode && (
          <div className="absolute top-4 left-4 z-10">
            <DemoModeBanner compact />
          </div>
        )}
        <ResultImage resultUrl={result} originalUrl={originalUrl} />
      </div>

      {params.length > 0 && paramsTitleKey && (
        <div className={`w-full p-6 ${UI_CARD}`}>
          <h3 className="text-xl font-bold text-white mb-4">{t(paramsTitleKey)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {params.map((param, idx) => (
              <div key={idx}>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(param.labelKey)}
                </span>
                <span className="text-base text-gray-200 leading-relaxed">
                  {typeof param.value === 'string' ? param.value : param.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResultActions result={result} originalUrl={originalUrl} fileBaseName={fileBaseName} />

      <div className="flex flex-wrap items-center justify-center gap-4">
        {onEditInEditor && (
          <button type="button" onClick={onEditInEditor} className={UI_BTN_PRIMARY}>
            {t(editKey)}
          </button>
        )}

        <button type="button" onClick={onAgain} className={UI_BTN_SECONDARY}>
          {t(againKey)}
        </button>
      </div>
    </div>
  );
};

export default GenericResult;
