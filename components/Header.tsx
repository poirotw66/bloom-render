/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { BookmarkIcon, CogIcon, GitHubIcon, ListBulletIcon } from './icons';
import SettingsModal from './SettingsModal';
import StartTabNav, { type StartTab } from './StartTabNav';
import { publicAssetUrl as asset } from '../utils/publicAsset';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { ROUTES } from '../constants/routes';
import { GITHUB_REPO_URL } from '../constants/site';
import HistoryPanel from './HistoryPanel';
import {
  closeSettingsPanel,
  openSettingsPanel,
  useSettingsPanelOpen,
} from '../utils/settingsPanel';

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
  const { t, language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  // Shared store rather than local state: the API-key notice on feature pages
  // opens this dialog too.
  const isSettingsOpen = useSettingsPanelOpen();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const location = useLocation();

  const currentTab: StartTab | null = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith(ROUTES.PHOTOGRAPHY_SERVICE)) return 'photography-service';
    if (path.startsWith(ROUTES.GENERATE)) return 'generate';
    if (path.startsWith(ROUTES.ID_PHOTO)) return 'idphoto';
    if (path.startsWith(ROUTES.PORTRAIT)) return 'portrait';
    if (path.startsWith(ROUTES.TRAVEL)) return 'travel';
    if (path.startsWith(ROUTES.THEMED)) return 'themed';
    if (path.startsWith(ROUTES.COUPLE_GROUP)) return 'couple-group';
    if (path.startsWith(ROUTES.TRY_ON)) return 'tryon';
    if (path.startsWith(ROUTES.ENHANCE)) return 'enhance';
    if (path.startsWith(ROUTES.RESTORE)) return 'restore';
    // Home / upload only — do not treat prompt gallery, editor, history, etc. as upload.
    if (path === ROUTES.HOME || path === '') return 'upload';
    return null;
  }, [location.pathname]);

  return (
    <>
      <header
        className={`w-full max-w-[1600px] mx-auto mt-4 mb-6 px-4 sm:px-6 md:px-8 py-4 rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
          theme === 'newyear'
            ? 'theme-surface theme-border'
            : theme === 'bloom'
              ? 'theme-surface theme-border'
              : 'theme-surface theme-border'
        }`}
        role="banner"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-between">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity duration-200 order-1 shrink-0"
            aria-label={t('app.title')}
            onClick={(event) => {
              if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) {
                event.preventDefault();
              }
            }}
          >
            <span className="flex shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
              <LogoIcon className="w-full h-full object-contain" />
            </span>
            <div className="flex flex-col">
              <p
                className={`text-xl font-semibold tracking-tight ${
                  theme === 'newyear'
                    ? 'text-red-50'
                    : theme === 'bloom'
                      ? 'text-gray-100'
                      : 'text-gray-100'
                }`}
              >
                {t('app.title')}
              </p>
              <span
                className={`text-sm font-normal ${
                  theme === 'newyear'
                    ? 'text-red-200'
                    : theme === 'bloom'
                      ? 'brand-text-soft'
                      : 'text-slate-300'
                }`}
              >
                {t('app.slogan')}
              </span>
            </div>
          </Link>

          <div className="w-full order-3 md:order-2 md:flex-1 md:min-w-[260px] md:flex md:justify-center">
            <StartTabNav currentTab={currentTab} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 order-2 md:order-3 shrink-0">
            <div
              className="inline-flex items-center rounded-lg border theme-border theme-raised p-0.5"
              role="group"
              aria-label={t('a11y.lang_toggle')}
            >
              <button
                type="button"
                data-testid="lang-toggle-zh"
                aria-pressed={language === 'zh-TW'}
                onClick={() => setLanguage('zh-TW')}
                className={`px-2 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:brand-ring ${
                  language === 'zh-TW' ? 'brand-bg text-white' : 'theme-ink-soft hover:opacity-90'
                }`}
              >
                中
              </button>
              <button
                type="button"
                data-testid="lang-toggle-en"
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:brand-ring ${
                  language === 'en' ? 'brand-bg text-white' : 'theme-ink-soft hover:opacity-90'
                }`}
              >
                EN
              </button>
            </div>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 hover:bg-white/10 ${
                theme === 'newyear'
                  ? 'text-red-200 hover:text-red-50 focus-visible:ring-red-500'
                  : theme === 'bloom'
                    ? 'text-gray-300 hover:text-white focus-visible:brand-ring'
                    : 'text-slate-300 hover:text-white focus-visible:ring-blue-500'
              }`}
              aria-label={t('a11y.github')}
              title={t('a11y.github')}
            >
              <GitHubIcon className="w-5 h-5" />
            </a>
            <Link
              to={ROUTES.PROMPT_GALLERY}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 hover:bg-white/10 ${
                theme === 'newyear'
                  ? 'text-red-200 hover:text-red-50 focus-visible:ring-red-500'
                  : theme === 'bloom'
                    ? 'text-gray-300 hover:text-white focus-visible:brand-ring'
                    : 'text-slate-300 hover:text-white focus-visible:ring-blue-500'
              } ${location.pathname.startsWith(ROUTES.PROMPT_GALLERY) ? 'bg-white/10' : ''}`}
              aria-label={t('prompt_gallery.title')}
              title={t('prompt_gallery.title')}
            >
              <BookmarkIcon className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 hover:bg-white/10 ${
                theme === 'newyear'
                  ? 'text-red-200 hover:text-red-50 focus-visible:ring-red-500'
                  : theme === 'bloom'
                    ? 'text-gray-300 hover:text-white focus-visible:brand-ring'
                    : 'text-slate-300 hover:text-white focus-visible:ring-blue-500'
              }`}
              aria-label={t('history.title')}
              title={t('history.title')}
              aria-haspopup="dialog"
              aria-expanded={isHistoryOpen}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={openSettingsPanel}
              className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 hover:bg-white/10 ${
                theme === 'newyear'
                  ? 'text-red-200 hover:text-red-50 focus-visible:ring-red-500'
                  : theme === 'bloom'
                    ? 'text-gray-300 hover:text-white focus-visible:brand-ring'
                    : 'text-slate-300 hover:text-white focus-visible:ring-blue-500'
              }`}
              aria-label={t('settings.title')}
              title={t('settings.title')}
              aria-haspopup="dialog"
              aria-expanded={isSettingsOpen}
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettingsPanel} />
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onImageSelected={onImageSelected}
      />
    </>
  );
};

export default React.memo(Header);
