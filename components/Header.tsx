/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { CogIcon, ListBulletIcon } from './icons';
import SettingsModal from './SettingsModal';
import StartTabNav, { type StartTab } from './StartTabNav';
import { publicAssetUrl as asset } from '../utils/publicAsset';
import { ROUTES } from '../constants/routes';
import HistoryPanel from './HistoryPanel';

/** BloomRender logo for header (product branding) */
const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={asset('logo/bloomrender_bg.png')}
    alt="BloomRender"
    className={className}
    width={36}
    height={36}
  />
);

interface HeaderProps {
  onImageSelected?: (file: File) => void;
}

const Header: React.FC<HeaderProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab: StartTab = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith(ROUTES.PHOTOGRAPHY_SERVICE)) return 'photography-service';
    if (path.startsWith(ROUTES.GENERATE)) return 'generate';
    if (path.startsWith(ROUTES.ID_PHOTO)) return 'idphoto';
    if (path.startsWith(ROUTES.PORTRAIT)) return 'portrait';
    if (path.startsWith(ROUTES.TRAVEL)) return 'travel';
    if (path.startsWith(ROUTES.THEMED)) return 'themed';
    if (path.startsWith(ROUTES.COUPLE_GROUP)) return 'couple-group';
    if (path.startsWith(ROUTES.TRY_ON)) return 'tryon';
    return 'upload';
  }, [location.pathname]);

  return (
    <>
      <header
        className={`w-full max-w-[1600px] mx-auto mt-4 mb-6 px-4 sm:px-6 md:px-8 py-4 border rounded-2xl backdrop-blur-md shadow-lg transition-colors duration-300 ${
          theme === 'newyear'
            ? 'border-red-700/50 bg-red-900/40 shadow-red-900/20'
            : theme === 'bloom'
              ? 'border-fuchsia-500/20 bg-gray-800/50 shadow-fuchsia-500/5'
              : 'border-slate-600/40 bg-gray-800/50 shadow-slate-500/5'
        }`}
        role="banner"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-between">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity duration-200 order-1 shrink-0"
            aria-label={t('app.title')}
          >
            <span className="flex shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
              <LogoIcon className="w-full h-full object-contain" />
            </span>
            <div className="flex flex-col">
              <h1
                className={`text-xl font-bold tracking-tight ${
                  theme === 'newyear'
                    ? 'text-red-50'
                    : theme === 'bloom'
                      ? 'text-gray-100'
                      : 'text-gray-100'
                }`}
              >
                {t('app.title')}
              </h1>
              <span
                className={`text-xs font-normal ${
                  theme === 'newyear'
                    ? 'text-red-200'
                    : theme === 'bloom'
                      ? 'text-fuchsia-200'
                      : 'text-slate-300'
                }`}
              >
                {t('app.slogan')}
              </span>
            </div>
          </Link>

          <div className="w-full order-3 md:order-2 md:flex-1 md:min-w-[260px] md:flex md:justify-center">
            <StartTabNav currentTab={currentTab} navigate={navigate} theme={theme} />
          </div>

          <div className="flex items-center gap-2 order-2 md:order-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 hover:bg-white/10 ${
                theme === 'newyear'
                  ? 'text-red-200 hover:text-red-50 focus:ring-red-500'
                  : theme === 'bloom'
                    ? 'text-gray-300 hover:text-white focus:ring-fuchsia-500'
                    : 'text-slate-300 hover:text-white focus:ring-blue-500'
              }`}
              aria-label={t('history.title')}
              title={t('history.title')}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 hover:bg-white/10 ${
                theme === 'newyear'
                  ? 'text-red-200 hover:text-red-50 focus:ring-red-500'
                  : theme === 'bloom'
                    ? 'text-gray-300 hover:text-white focus:ring-fuchsia-500'
                    : 'text-slate-300 hover:text-white focus:ring-blue-500'
              }`}
              aria-label={t('settings.title')}
              title={t('settings.title')}
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onImageSelected={onImageSelected}
      />
    </>
  );
};

export default React.memo(Header);
