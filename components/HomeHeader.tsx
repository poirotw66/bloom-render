/** @license SPDX-License-Identifier: MIT */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../constants/routes';
import { publicAssetUrl } from '../utils/publicAsset';
import { openSettingsPanel } from '../utils/settingsPanel';
import { CogIcon } from './icons';

const tools = [
  ['start.tab_generate', ROUTES.GENERATE],
  ['start.tab_idphoto', ROUTES.ID_PHOTO],
  ['start.tab_portrait', ROUTES.PORTRAIT],
  ['start.tab_travel', ROUTES.TRAVEL],
  ['start.tab_themed', ROUTES.THEMED],
  ['start.tab_couple_group', ROUTES.COUPLE_GROUP],
  ['start.tab_tryon', ROUTES.TRY_ON],
  ['start.tab_enhance', ROUTES.ENHANCE],
  ['start.tab_restore', ROUTES.RESTORE],
  ['start.tab_service', ROUTES.PHOTOGRAPHY_SERVICE],
] as const;

export default function HomeHeader({
  settingsOpen,
  onOpenHistory,
}: {
  settingsOpen: boolean;
  onOpenHistory: () => void;
}) {
  const { t, language, setLanguage } = useLanguage();
  const menu = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [menuOpen]);
  return (
    <header className="home-nav nav" role="banner" aria-label={t('home.navigation')}>
      <div className="wrap home-wrap home-nav__bar">
        <Link to={ROUTES.HOME} className="home-logo" aria-label={t('app.title')}>
          <img src={publicAssetUrl('logo/bloomrender_bg.png')} width="32" height="32" alt="" />
          <span>
            BloomRender<span className="home-logo__dot">.</span>
          </span>
        </Link>
        <nav className="home-nav__links" aria-label={t('home.navigation')}>
          <a href="#styles">{t('home.nav_styles')}</a>
          <a href="#studio">{t('home.nav_studio')}</a>
          <Link to={ROUTES.GENERATE}>{t('start.tab_generate')}</Link>
        </nav>
        <div className="home-nav__actions">
          <div className="home-language" role="group" aria-label={t('a11y.lang_toggle')}>
            {(['zh-TW', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                data-testid={lang === 'en' ? 'lang-toggle-en' : 'lang-toggle-zh'}
                aria-pressed={language === lang}
                onClick={() => setLanguage(lang)}
              >
                {lang === 'en' ? 'EN' : '中'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="home-icon-button"
            onClick={openSettingsPanel}
            aria-label={t('settings.title')}
            title={t('settings.title')}
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
          >
            <CogIcon className="w-5 h-5" />
          </button>
          <div
            className="home-menu"
            ref={menu}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                closeMenu();
                menuButton.current?.focus();
              }
            }}
          >
            <button
              ref={menuButton}
              type="button"
              className="home-icon-button"
              aria-label={t('home.all_tools')}
              aria-expanded={menuOpen}
              aria-controls="home-tools-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <nav
              id="home-tools-menu"
              hidden={!menuOpen}
              className="home-menu__panel"
              aria-label={t('home.all_tools')}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) closeMenu();
              }}
            >
              <p>{t('home.all_tools')}</p>
              <div className="home-menu__tools">
                {tools.map(([key, route]) => (
                  <Link key={route} to={route}>
                    {t(key)} <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
              <div className="home-menu__extra">
                <a href="#styles">{t('home.nav_styles')}</a>
                <Link to={ROUTES.PROMPT_GALLERY}>{t('prompt_gallery.title')}</Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    menuButton.current?.focus();
                    onOpenHistory();
                  }}
                >
                  {t('history.title')}
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
