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
import { UI_LABEL, UI_OPTION } from '../../utils/uiClasses';

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
    <div className="flex flex-col gap-3 w-full">
      <label className={UI_LABEL}>
        {mode === 'couple' ? t('couple_group.label.style') : t('couple_group.label.group_style')}
      </label>
      <div className="flex flex-wrap justify-center gap-2">
        {styles.map((s) => {
          const isActive = style === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => !disabled && onChange(s.id as CoupleGroupStyle)}
              disabled={disabled}
              className={`${UI_OPTION} ${
                isActive
                  ? mode === 'couple'
                    ? 'bg-pink-600 text-white border-pink-500 focus:ring-pink-500'
                    : 'bg-purple-600 text-white border-purple-500 focus:ring-purple-500'
                  : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 focus:ring-gray-500'
              }`}
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
