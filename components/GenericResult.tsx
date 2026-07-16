/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic result display component for generate pages.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_BTN_PRIMARY, UI_BTN_SECONDARY, UI_BTN_SUCCESS, UI_CARD } from '../utils/uiClasses';

interface GenericResultProps {
  result: string;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor?: () => void;
  paramsTitleKey?: string;
  params?: Array<{ labelKey: string; value: string | React.ReactNode }>;
  downloadKey?: string;
  editKey?: string;
  againKey?: string;
  className?: string;
}

const GenericResult: React.FC<GenericResultProps> = ({
  result,
  onDownload,
  onAgain,
  onEditInEditor,
  paramsTitleKey,
  params = [],
  downloadKey = 'start.idphoto_download',
  editKey = 'start.idphoto_edit',
  againKey = 'start.idphoto_again',
  className = '',
}) => {
  const { t } = useLanguage();

  return (
    <div className={`flex flex-col items-center gap-6 w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
        <img src={result} alt="Generated result" className="w-full h-auto" />
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

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={onDownload} className={UI_BTN_SUCCESS}>
          <span>💾</span>
          {t(downloadKey)}
        </button>

        {onEditInEditor && (
          <button type="button" onClick={onEditInEditor} className={UI_BTN_PRIMARY}>
            <span>✏️</span>
            {t(editKey)}
          </button>
        )}

        <button type="button" onClick={onAgain} className={UI_BTN_SECONDARY}>
          <span>🔄</span>
          {t(againKey)}
        </button>
      </div>
    </div>
  );
};

export default GenericResult;
