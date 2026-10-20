/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Result display component for couple/group photos.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDisplayResult } from '../../hooks/useDisplayResult';
import { EditIcon } from '../../components/icons';
import ResultActions from '../../components/ResultActions';
import ResultImage from '../../components/ResultImage';
import type { CoupleGroupMode, CoupleGroupStyle } from './types';
import { COUPLE_STYLES, GROUP_STYLES } from '../../constants/coupleGroup';

interface CoupleGroupResultProps {
  result: string;
  originalUrl?: string | null;
  mode: CoupleGroupMode;
  style: CoupleGroupStyle;
  onEditInEditor: () => void;
}

const CoupleGroupResult: React.FC<CoupleGroupResultProps> = ({
  result,
  originalUrl,
  mode,
  style,
  onEditInEditor,
}) => {
  const { t } = useLanguage();
  const { displayResult, onEnhanced } = useDisplayResult(result);

  const styleConfig =
    mode === 'couple'
      ? COUPLE_STYLES.find((s) => s.id === style)
      : GROUP_STYLES.find((s) => s.id === style);

  return (
    <div className="flex flex-col items-center gap-4 w-full animate-fade-in bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div className="w-full max-h-[480px] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center shadow-lg p-2">
        <ResultImage
          resultUrl={displayResult}
          originalUrl={originalUrl}
          alt={t(`couple_group.mode.${mode}`)}
          imageClassName="max-w-full max-h-[400px] w-auto h-auto object-contain"
        />
      </div>

      <div className="w-full bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <h3 className="text-sm font-bold text-white mb-3">
          {t('couple_group.result.params_title')}
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('couple_group.result.mode')}
            </span>
            <span className="text-gray-200">{t(`couple_group.mode.${mode}`)}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('couple_group.result.style')}
            </span>
            <span className="text-gray-200">{styleConfig ? t(styleConfig.nameKey) : style}</span>
          </div>
        </div>
      </div>

      <ResultActions
        result={displayResult}
        originalUrl={originalUrl}
        fileBaseName={`${mode}-photo`}
        onEnhanced={onEnhanced}
        extraActions={
          <button
            type="button"
            onClick={onEditInEditor}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all text-sm border border-gray-600 active:scale-95"
          >
            <EditIcon className="w-4 h-4" />
            {t('couple_group.edit')}
          </button>
        }
      />
    </div>
  );
};

export default CoupleGroupResult;
