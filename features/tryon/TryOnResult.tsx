/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Result display for AI try-on.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDisplayResult } from '../../hooks/useDisplayResult';
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
  const { displayResult, onEnhanced } = useDisplayResult(result);

  return (
    <div className="tryon-result">
      {label && <span className="tryon-badge">{label}</span>}
      <div className="tryon-result-image">
        <ResultImage
          resultUrl={displayResult}
          originalUrl={originalUrl}
          alt={label || t('tryon.title')}
          imageClassName="max-w-full max-h-[420px] w-auto h-auto object-contain"
        />
      </div>
      <ResultActions
        result={displayResult}
        originalUrl={originalUrl}
        fileBaseName="tryon"
        onEnhanced={onEnhanced}
        extraActions={
          <>
            <button
              type="button"
              onClick={onEditInEditor}
              className="tool-button tool-button-secondary"
            >
              <EditIcon className="w-4 h-4" />
              {t('tryon.edit')}
            </button>
            {!hideAgain && onAgain && (
              <button type="button" onClick={onAgain} className="tool-button tool-button-secondary">
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
