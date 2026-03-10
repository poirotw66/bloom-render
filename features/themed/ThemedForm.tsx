/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { THEMED_TYPES } from '../../constants/themed';
import type { ThemedType } from '../../types';

interface ThemedFormProps {
  themeType: ThemedType;
  setThemeType: (v: ThemedType) => void;
  disabled?: boolean;
}

const ThemedForm: React.FC<ThemedFormProps> = ({ themeType, setThemeType, disabled = false }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          {t('themed.label.type')}
        </label>
        <select
          value={themeType}
          onChange={(e) => setThemeType(e.target.value as ThemedType)}
          disabled={disabled}
          className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {THEMED_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {t(type.nameKey)}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">{t('idphoto.model_recommendation')}</p>
      </div>
    </div>
  );
};

export default ThemedForm;
