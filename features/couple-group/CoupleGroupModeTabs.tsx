/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mode tabs for switching between couple and group photo modes.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { CoupleGroupMode } from './types';

interface CoupleGroupModeTabsProps {
  mode: CoupleGroupMode;
  onChange: (mode: CoupleGroupMode) => void;
}

const CoupleGroupModeTabs: React.FC<CoupleGroupModeTabsProps> = ({ mode, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center mb-6">
      <div className="flex bg-gray-900/60 p-1 rounded-full border border-gray-700/50 backdrop-blur-md shadow-inner">
        <button
          onClick={() => onChange('couple')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            mode === 'couple'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          💑 {t('couple_group.mode.couple')}
        </button>
        <button
          onClick={() => onChange('group')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            mode === 'group'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          👨‍👩‍👧‍👦 {t('couple_group.mode.group')}
        </button>
      </div>
    </div>
  );
};

export default CoupleGroupModeTabs;
