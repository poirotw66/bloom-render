/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Style selector for choosing couple or group specific styles.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { COUPLE_STYLES, GROUP_STYLES } from '../../constants/coupleGroup';
import type { CoupleGroupMode, CoupleGroupStyle } from './types';

interface CoupleGroupStyleSelectorProps {
  mode: CoupleGroupMode;
  style: CoupleGroupStyle;
  onChange: (style: CoupleGroupStyle) => void;
  disabled?: boolean;
}

const CoupleGroupStyleSelector: React.FC<CoupleGroupStyleSelectorProps> = ({
  mode,
  style,
  onChange,
  disabled = false,
}) => {
  const { t } = useLanguage();

  const styles = mode === 'couple' ? COUPLE_STYLES : GROUP_STYLES;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mb-6">
      <label className="block text-sm font-medium text-gray-400 text-center">
        {mode === 'couple' ? t('couple_group.label.style') : t('couple_group.label.group_style')}
      </label>
      <div className="flex flex-wrap justify-center gap-2">
        {styles.map((s) => {
          const isActive = style === s.id;
          return (
            <button
              key={s.id}
              onClick={() => !disabled && onChange(s.id as CoupleGroupStyle)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive
                  ? mode === 'couple'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                    : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {t(s.nameKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CoupleGroupStyleSelector;
