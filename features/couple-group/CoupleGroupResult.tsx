/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Result display component for couple/group photos.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DownloadIcon, RefreshIcon, EditIcon } from '../../components/icons';
import type { CoupleGroupMode, CoupleGroupStyle } from './types';
import { COUPLE_STYLES, GROUP_STYLES } from '../../constants/coupleGroup';

interface CoupleGroupResultProps {
  result: string;
  mode: CoupleGroupMode;
  style: CoupleGroupStyle;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const CoupleGroupResult: React.FC<CoupleGroupResultProps> = ({
  result,
  mode,
  style,
  onDownload,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();

  const styleConfig =
    mode === 'couple'
      ? COUPLE_STYLES.find((s) => s.id === style)
      : GROUP_STYLES.find((s) => s.id === style);

  return (
    <div className="flex flex-col items-center gap-4 w-full animate-fade-in bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div className="w-full aspect-[3/4] max-h-[400px] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center shadow-lg">
        <img
          src={result}
          alt={`Generated ${mode === 'couple' ? 'Couple' : 'Group'} ${style} Photo`}
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>
      
      <div className="w-full bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <h3 className="text-sm font-bold text-white mb-3">{t('couple_group.result.params_title')}</h3>
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
            <span className="text-gray-200">
              {styleConfig ? t(styleConfig.nameKey) : style}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={onDownload}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg transition-all text-sm active:scale-95"
        >
          <DownloadIcon className="w-4 h-4" />
          {t('couple_group.download')}
        </button>
        <button
          onClick={onEditInEditor}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all text-sm border border-gray-600 active:scale-95"
        >
          <EditIcon className="w-4 h-4" />
          {t('couple_group.edit')}
        </button>
      </div>
    </div>
  );
};

export default CoupleGroupResult;
