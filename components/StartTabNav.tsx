/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export type StartTab = 'upload' | 'generate' | 'idphoto' | 'travel' | 'photography-service';

interface StartTabNavProps {
  currentTab: StartTab;
  navigate: (path: string) => void;
}

const StartTabNav: React.FC<StartTabNavProps> = ({ currentTab, navigate }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-800/50 p-1 rounded-xl flex flex-wrap items-center justify-center gap-1 border border-gray-700 mt-4 mb-4">
      <button
        onClick={() => navigate('/photography-service')}
        className={`px-5 py-3 rounded-lg text-base md:text-lg font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${currentTab === 'photography-service'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
      >
        {t('start.tab_service')}
      </button>
      <button
        onClick={() => navigate('/')}
        className={`px-5 py-3 rounded-lg text-base md:text-lg font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${currentTab === 'upload'
            ? 'bg-gray-700 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
      >
        {t('start.tab_upload')}
      </button>
      <button
        onClick={() => navigate('/generate')}
        className={`px-5 py-3 rounded-lg text-base md:text-lg font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${currentTab === 'generate'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
      >
        {t('start.tab_generate')}
      </button>
      <button
        onClick={() => navigate('/idphoto')}
        className={`px-5 py-3 rounded-lg text-base md:text-lg font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${currentTab === 'idphoto'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
      >
        {t('start.tab_idphoto')}
      </button>
      <button
        onClick={() => navigate('/travel')}
        className={`px-5 py-3 rounded-lg text-base md:text-lg font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${currentTab === 'travel'
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
      >
        {t('start.tab_travel')}
      </button>
    </div>
  );
};

export default StartTabNav;
