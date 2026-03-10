/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic result display component for generate pages.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
        <div className="w-full bg-gray-800/40 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
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
        <button
          onClick={onDownload}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 hover:-translate-y-px active:scale-95"
        >
          <span>💾</span>
          {t(downloadKey)}
        </button>

        {onEditInEditor && (
          <button
            onClick={onEditInEditor}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:-translate-y-px active:scale-95"
          >
            <span>✏️</span>
            {t(editKey)}
          </button>
        )}

        <button
          onClick={onAgain}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white font-bold rounded-xl shadow-lg hover:bg-gray-600 transition-all duration-200 hover:-translate-y-px active:scale-95"
        >
          <span>🔄</span>
          {t(againKey)}
        </button>
      </div>
    </div>
  );
};

export default GenericResult;
