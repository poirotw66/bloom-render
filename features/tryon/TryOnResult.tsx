/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Result display for AI try-on.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DownloadIcon, RefreshIcon, EditIcon } from '../../components/icons';

interface TryOnResultProps {
  result: string;
  /** Optional label (e.g. "Style 1") when showing multiple results. */
  label?: string;
  onDownload: () => void;
  onAgain?: () => void;
  onEditInEditor: () => void;
  /** When true, hide "Try Again" (parent shows one button for all). */
  hideAgain?: boolean;
}

const TryOnResult: React.FC<TryOnResultProps> = ({
  result,
  label,
  onDownload,
  onAgain,
  onEditInEditor,
  hideAgain = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center gap-4 w-full animate-fade-in bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      {label && (
        <span className="text-sm font-bold text-teal-400 uppercase tracking-wider">{label}</span>
      )}
      <div className="w-full aspect-[3/4] max-h-[420px] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center shadow-lg">
        <img
          src={result}
          alt={label || 'Virtual try-on result'}
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <button
          onClick={onDownload}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-all text-sm active:scale-95"
        >
          <DownloadIcon className="w-4 h-4" />
          {t('tryon.download')}
        </button>
        <button
          onClick={onEditInEditor}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all text-sm border border-gray-600 active:scale-95"
        >
          <EditIcon className="w-4 h-4" />
          {t('tryon.edit')}
        </button>
        {!hideAgain && onAgain && (
          <button
            onClick={onAgain}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-600 text-gray-300 hover:text-white hover:bg-white/5 font-semibold rounded-lg transition-all text-sm active:scale-95"
          >
            <RefreshIcon className="w-4 h-4" />
            {t('tryon.again')}
          </button>
        )}
      </div>
    </div>
  );
};

export default TryOnResult;
