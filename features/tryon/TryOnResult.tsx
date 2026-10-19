/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Result display for AI try-on.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { RefreshIcon, EditIcon } from '../../components/icons';
import ResultActions from '../../components/ResultActions';
import ResultImage from '../../components/ResultImage';

interface TryOnResultProps {
  result: string;
  originalUrl?: string | null;
  /** Optional label (e.g. "Style 1") when showing multiple results. */
  label?: string;
  onAgain?: () => void;
  onEditInEditor: () => void;
  /** When true, hide "Try Again" (parent shows one button for all). */
  hideAgain?: boolean;
}

const TryOnResult: React.FC<TryOnResultProps> = ({
  result,
  originalUrl,
  label,
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
      <div className="w-full max-h-[480px] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center shadow-lg p-2">
        <ResultImage
          resultUrl={result}
          originalUrl={originalUrl}
          alt={label || t('tryon.title')}
          imageClassName="max-w-full max-h-[420px] w-auto h-auto object-contain"
        />
      </div>
      <ResultActions
        result={result}
        originalUrl={originalUrl}
        fileBaseName="tryon"
        extraActions={
          <>
            <button
              type="button"
              onClick={onEditInEditor}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all text-sm border border-gray-600 active:scale-95"
            >
              <EditIcon className="w-4 h-4" />
              {t('tryon.edit')}
            </button>
            {!hideAgain && onAgain && (
              <button
                type="button"
                onClick={onAgain}
                className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-600 text-gray-300 hover:text-white hover:bg-white/5 font-semibold rounded-lg transition-all text-sm active:scale-95"
              >
                <RefreshIcon className="w-4 h-4" />
                {t('tryon.again')}
              </button>
            )}
          </>
        }
      />
    </div>
  );
};

export default TryOnResult;
