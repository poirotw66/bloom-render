import React, { useId, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { GITHUB_REPO_URL } from '../constants/site';
import { useLanguage } from '../contexts/LanguageContext';
import { useToolCommands, type ToolCommand } from '../contexts/ToolCommandsContext';
import { useDialog } from '../hooks/useDialog';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { publicAssetUrl } from '../utils/publicAsset';
import { ChevronDownIcon, CogIcon, ListBulletIcon, XMarkIcon } from './icons';
import '../styles/tool-header.css';

type ToolNavigationItem = { path: string; labelKey: string };

const TOOL_NAVIGATION: readonly ToolNavigationItem[] = [
  { path: ROUTES.HOME, labelKey: 'start.tab_upload' },
  { path: ROUTES.GENERATE, labelKey: 'start.tab_generate' },
  { path: ROUTES.PHOTOGRAPHY_SERVICE, labelKey: 'start.tab_service' },
  { path: ROUTES.ID_PHOTO, labelKey: 'start.tab_idphoto' },
  { path: ROUTES.PORTRAIT, labelKey: 'start.tab_portrait' },
  { path: ROUTES.TRAVEL, labelKey: 'start.tab_travel' },
  { path: ROUTES.THEMED, labelKey: 'start.tab_themed' },
  { path: ROUTES.COUPLE_GROUP, labelKey: 'start.tab_couple_group' },
  { path: ROUTES.TRY_ON, labelKey: 'start.tab_tryon' },
  { path: ROUTES.ENHANCE, labelKey: 'start.tab_enhance' },
  { path: ROUTES.RESTORE, labelKey: 'start.tab_restore' },
  { path: ROUTES.PROMPT_GALLERY, labelKey: 'prompt_gallery.title' },
  { path: ROUTES.MATERIALS, labelKey: 'materials.title' },
];

interface ToolHeaderProps {
  settingsOpen: boolean;
  historyOpen: boolean;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export default function ToolHeader({
  settingsOpen,
  historyOpen,
  onOpenHistory,
  onOpenSettings,
}: ToolHeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const { commands } = useToolCommands();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const closeMenu = () => setMenuOpen(false);
  const dialog = useDialog<HTMLDivElement>(menuOpen, closeMenu);
  const current = TOOL_NAVIGATION.find(
    (item) => item.path !== ROUTES.HOME && location.pathname.startsWith(item.path),
  );
  const label = (item: ToolNavigationItem) =>
    item.labelKey === 'materials.title'
      ? language === 'zh-TW'
        ? '參考素材'
        : 'Reference materials'
      : t(item.labelKey);
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) event.preventDefault();
    else closeMenu();
  };
  const selectMenuCommand = (command: ToolCommand) => {
    // Finish the menu's focus restoration before the next dialog takes focus.
    flushSync(closeMenu);
    command.onSelect();
  };
  const languageButtons = (compact: boolean) => (
    <div
      className={`tool-header__language${compact ? ' tool-header__language--bar' : ''}`}
      role="group"
      aria-label={t('a11y.lang_toggle')}
    >
      {(['zh-TW', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          className="tool-control tool-button tool-button-secondary"
          data-testid={compact ? (lang === 'en' ? 'lang-toggle-en' : 'lang-toggle-zh') : undefined}
          aria-pressed={language === lang}
          onClick={() => setLanguage(lang)}
        >
          {lang === 'en' ? 'EN' : '中'}
        </button>
      ))}
    </div>
  );

  return (
    <header className="tool-header nav" aria-label={t('home.navigation')}>
      <nav className="wrap tool-shell-wrap tool-header__bar" aria-label="Primary">
        <Link
          to={ROUTES.HOME}
          className="tool-header__brand"
          aria-label={t('app.title')}
          onClick={navigate}
        >
          <img src={publicAssetUrl('logo/bloomrender_bg.png')} width="32" height="32" alt="" />
          <span>BloomRender</span>
        </Link>
        <div className="tool-header__actions">
          {commands.length > 0 && (
            <div
              className="tool-header__commands"
              role="group"
              aria-label={language === 'zh-TW' ? '工作區操作' : 'Workspace actions'}
            >
              {commands.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  className="tool-control tool-button tool-button-secondary"
                  onClick={command.onSelect}
                >
                  {command.label}
                </button>
              ))}
            </div>
          )}
          {languageButtons(true)}
          <button
            type="button"
            className="tool-control tool-button tool-button-secondary tool-header__icon"
            aria-label={t('history.title')}
            title={t('history.title')}
            aria-haspopup="dialog"
            aria-expanded={historyOpen}
            onClick={onOpenHistory}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="tool-control tool-button tool-button-secondary tool-header__icon"
            aria-label={t('settings.title')}
            title={t('settings.title')}
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={onOpenSettings}
          >
            <CogIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="tool-control tool-button tool-button-secondary tool-header__menu-trigger"
            aria-label={t('home.all_tools')}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-controls={menuId}
            onClick={() => setMenuOpen(true)}
          >
            <span className="tool-header__current">
              {current ? label(current) : t('home.all_tools')}
            </span>
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div
          className="tool-header__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <div
            ref={dialog}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${menuId}-title`}
            tabIndex={-1}
            className="tool-header__menu"
          >
            <div className="tool-header__menu-heading">
              <h2 id={`${menuId}-title`}>{t('home.all_tools')}</h2>
              <button
                type="button"
                className="tool-control tool-button tool-button-secondary tool-header__icon"
                aria-label={language === 'zh-TW' ? '關閉工具選單' : 'Close tools menu'}
                onClick={closeMenu}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="tool-header__menu-language">{languageButtons(false)}</div>
            {commands.length > 0 && (
              <div
                className="tool-header__menu-commands"
                role="group"
                aria-label={language === 'zh-TW' ? '工作區操作' : 'Workspace actions'}
              >
                {commands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    className="tool-control tool-button tool-button-secondary"
                    onClick={() => selectMenuCommand(command)}
                  >
                    {command.label}
                  </button>
                ))}
              </div>
            )}
            <div className="tool-header__tools">
              {TOOL_NAVIGATION.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={current?.path === item.path ? 'page' : undefined}
                  onClick={navigate}
                >
                  {label(item)}
                </Link>
              ))}
            </div>
            <div className="tool-header__menu-extra">
              <Link to={ROUTES.HISTORY} onClick={navigate}>
                {t('history.title')}
              </Link>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                {t('a11y.github')}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
