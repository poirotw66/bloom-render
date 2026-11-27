import React, { useId, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { TOOL_NAVIGATION, type ToolNavigationItem } from '../constants/toolNavigation';
import { GITHUB_REPO_URL } from '../constants/site';
import { useLanguage } from '../contexts/LanguageContext';
import { useCommandPalette } from '../contexts/CommandPaletteContext';
import { useMaterialBasket } from '../contexts/MaterialBasketContext';
import { useToolCommands, type ToolCommand } from '../contexts/ToolCommandsContext';
import { useDialog } from '../hooks/useDialog';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { publicAssetUrl } from '../utils/publicAsset';
import { ChevronDownIcon, ListBulletIcon, XMarkIcon } from './icons';
import '../styles/tool-header.css';

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
  const basket = useMaterialBasket();
  const palette = useCommandPalette();
  const basketLabel = language === 'zh-TW' ? '素材籃' : 'Material basket';
  const workspaceCommands = [
    {
      id: 'material-basket',
      label: `${language === 'zh-TW' ? '素材籃' : 'Basket'} (${basket.materialIds.length})`,
      onSelect: basket.openBasket,
    },
    ...(palette
      ? [
          {
            id: 'command-palette',
            label: language === 'zh-TW' ? '搜尋' : 'Search',
            onSelect: palette.openPalette,
          },
        ]
      : []),
    ...commands,
  ];
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const closeMenu = () => setMenuOpen(false);
  const dialog = useDialog<HTMLDivElement>(menuOpen, closeMenu);
  const currentPath = location.pathname.startsWith(`${ROUTES.MATERIALS}/`)
    ? ROUTES.MATERIALS
    : location.pathname === ROUTES.EDIT
      ? ROUTES.HOME
      : location.pathname;
  const current = TOOL_NAVIGATION.flatMap((group) => group.items).find(
    (item) => item.path === currentPath,
  );
  const label = (item: ToolNavigationItem) =>
    item.labelKey === 'materials.title'
      ? language === 'zh-TW'
        ? '參考素材'
        : 'Reference materials'
      : `${t(item.labelKey)}${item.detailKey ? ` · ${t(item.detailKey)}` : ''}`;
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
        <div
          className="tool-header__primary"
          aria-label={language === 'zh-TW' ? '創作與素材' : 'Studio and materials'}
        >
          <Link
            to={ROUTES.TRY_ON}
            onClick={navigate}
            aria-current={location.pathname === ROUTES.TRY_ON ? 'page' : undefined}
          >
            {t('start.tab_tryon')}
          </Link>
          <Link
            to={ROUTES.MATERIALS}
            onClick={navigate}
            aria-current={currentPath === ROUTES.MATERIALS ? 'page' : undefined}
          >
            {language === 'zh-TW' ? '參考素材' : 'Reference materials'}
          </Link>
        </div>
        <div className="tool-header__actions">
          {palette && (
            <button
              type="button"
              className="tool-control tool-button tool-button-secondary tool-header__search"
              data-testid="command-palette-trigger"
              aria-label={language === 'zh-TW' ? '搜尋工具與素材' : 'Search tools and materials'}
              onClick={palette.openPalette}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <span>{language === 'zh-TW' ? '搜尋工具與素材' : 'Search tools and materials'}</span>
              <kbd>⌘ K</kbd>
            </button>
          )}
          <button
            type="button"
            className="tool-control tool-button tool-button-secondary tool-header__basket"
            title={basketLabel}
            aria-label={basketLabel}
            onClick={basket.openBasket}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="m4 9 2 11h12l2-11H4ZM8 9l4-6 4 6M9 12v5m6-5v5" />
            </svg>
            <span>{basket.materialIds.length}</span>
          </button>
          {languageButtons(true)}
          <button
            type="button"
            className="tool-control tool-button tool-button-secondary tool-header__icon tool-header__history"
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 17h16M8 4v6M16 14v6" strokeLinecap="round" />
            </svg>
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
            <span className="tool-header__current">{t('home.all_tools')}</span>
            <ChevronDownIcon className="w-5 h-5 tool-header__chevron" />
            <svg
              className="tool-header__menu-glyph"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
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
            {workspaceCommands.length > 0 && (
              <div
                className="tool-header__menu-commands"
                role="group"
                aria-label={language === 'zh-TW' ? '工作區操作' : 'Workspace actions'}
              >
                {workspaceCommands.map((command) => (
                  <button
                    key={command.id}
                    data-testid={
                      command.id === 'command-palette' ? 'command-palette-trigger' : undefined
                    }
                    aria-label={
                      command.id === 'material-basket'
                        ? basketLabel
                        : command.id === 'command-palette'
                          ? language === 'zh-TW'
                            ? '搜尋工具與素材'
                            : 'Search tools and materials'
                          : undefined
                    }
                    type="button"
                    className="tool-control tool-button tool-button-secondary"
                    onClick={() => selectMenuCommand(command)}
                  >
                    {command.label}
                  </button>
                ))}
              </div>
            )}
            <div className="tool-header__groups">
              {TOOL_NAVIGATION.map((group) => (
                <section
                  key={group.id}
                  className="tool-header__group"
                  aria-labelledby={`${menuId}-${group.id}`}
                >
                  <h3 id={`${menuId}-${group.id}`}>{group.label[language]}</h3>
                  <div className="tool-header__tools">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        aria-current={current?.path === item.path ? 'page' : undefined}
                        onClick={navigate}
                      >
                        {label(item)}
                        <span aria-hidden="true">↗</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="tool-header__menu-extra">
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
