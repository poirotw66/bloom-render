/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { CogIcon } from './icons';
import SettingsModal from './SettingsModal';

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.624l-.219.874-.219-.874a1.5 1.5 0 00-1.023-1.023l-.874-.219.874-.219a1.5 1.5 0 001.023-1.023l.219-.874.219.874a1.5 1.5 0 001.023 1.023l.874.219-.874.219a1.5 1.5 0 00-1.023 1.023z" />
  </svg>
);

const FirecrackerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 1 3 2.48Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.546 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
  </svg>
);

interface HeaderProps {
  onImageSelected?: (file: File) => void;
}

const Header: React.FC<HeaderProps> = ({ onImageSelected }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
        <header className={`w-full max-w-[1600px] mx-auto my-4 px-4 md:px-8 py-4 border rounded-xl backdrop-blur-md sticky top-4 z-40 shadow-lg shadow-black/20 transition-colors duration-300 ${
          theme === 'newyear' 
            ? 'border-red-700/50 bg-red-900/40' 
            : 'border-gray-700/50 bg-gray-800/40'
        }`}>
        <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
                <SparkleIcon className={`w-6 h-6 shrink-0 ${theme === 'newyear' ? 'text-red-400' : 'text-blue-400'}`} />
                <div className="flex flex-col">
                  <h1 className={`text-xl font-bold tracking-tight ${theme === 'newyear' ? 'text-red-50' : 'text-gray-100'}`}>
                    {t('app.title')}
                  </h1>
                  <span className={`text-xs font-normal ${theme === 'newyear' ? 'text-red-200/80' : 'text-gray-400'}`}>
                    {t('app.slogan')}
                  </span>
                </div>
            </Link>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => setTheme(theme === 'default' ? 'newyear' : 'default')}
                    className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        theme === 'newyear'
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20 focus:ring-red-500'
                            : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/10 focus:ring-yellow-500'
                    }`}
                    aria-label={theme === 'default' ? 'Switch to New Year theme' : 'Switch to default theme'}
                    title={theme === 'default' ? '新春喜慶' : '默認主題'}
                >
                    <FirecrackerIcon className="w-5 h-5" />
                    {theme === 'newyear' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    )}
                </button>

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 hover:bg-white/10 ${
                      theme === 'newyear'
                        ? 'text-red-200 hover:text-red-50 focus:ring-red-500'
                        : 'text-gray-300 hover:text-white focus:ring-blue-500'
                    }`}
                    aria-label="Settings"
                >
                    <CogIcon className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
                    className={`text-sm font-medium transition-colors duration-200 bg-white/10 px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/20 hover:border-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      theme === 'newyear'
                        ? 'text-red-200 hover:text-red-50 focus:ring-red-500'
                        : 'text-gray-300 hover:text-white focus:ring-blue-500'
                    }`}
                >
                    {language === 'en' ? '中文' : 'English'}
                </button>
            </div>
        </div>
        </header>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Header;
