import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';
import { useMaterialBasket } from '../contexts/MaterialBasketContext';
import { useToolCommands } from '../contexts/ToolCommandsContext';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { openSettingsPanel } from '../utils/settingsPanel';
import '../styles/command-palette.css';

type Command = { id: string; label: string; keywords: string; category: string; run: () => void };
const ROUTE_COMMANDS = [
  ['home', ROUTES.HOME, 'Home', '首頁'],
  ['generate', ROUTES.GENERATE, 'Generate image', '生成圖片'],
  ['edit', ROUTES.EDIT, 'Edit photo', '編輯照片'],
  ['history', ROUTES.HISTORY, 'Generation history', '生成紀錄'],
  ['idphoto', ROUTES.ID_PHOTO, 'ID photo', '證件照'],
  ['idphoto-batch', ROUTES.ID_PHOTO_BATCH, 'Batch ID photos', '批次證件照'],
  ['portrait', ROUTES.PORTRAIT, 'Portrait', '人像精修'],
  ['travel', ROUTES.TRAVEL, 'Travel photo', '旅遊照'],
  ['themed', ROUTES.THEMED, 'Themed photoshoot', '主題寫真'],
  ['couple-group', ROUTES.COUPLE_GROUP, 'Couple and group photos', '情侶與團體合照'],
  ['style-collage', ROUTES.STYLE_COLLAGE, 'Style collage', '風格拼圖'],
  ['multi-person', ROUTES.MULTI_PERSON, 'Multi-person synthesis', '多人合成'],
  ['try-on', ROUTES.TRY_ON, 'AI try-on', 'AI 試穿'],
  ['materials', ROUTES.MATERIALS, 'Reference materials', '參考素材'],
  ['photography-service', ROUTES.PHOTOGRAPHY_SERVICE, 'Photography studio', '專業照片館'],
  ['enhance', ROUTES.ENHANCE, 'Local enhance', '本機影像強化'],
  ['restore', ROUTES.RESTORE, 'Restore old photo', '老照片修復'],
  ['prompt-gallery', ROUTES.PROMPT_GALLERY, 'Prompt gallery', '提示詞藝廊'],
] as const;

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const { setTheme } = useTheme();
  const basket = useMaterialBasket();
  const { commands: workspace } = useToolCommands();
  const navigate = useNavigate();
  const location = useLocation();
  const initialPath = useRef(location.pathname);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const titleId = useId();
  const listId = useId();
  const zh = language === 'zh-TW';
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    input.current?.focus();
    return () => {
      element.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (location.pathname !== initialPath.current) onClose();
  }, [location.pathname, onClose]);
  const commands = useMemo(() => {
    const go = (path: string) => {
      if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) return;
      flushSync(onClose);
      navigate(path);
    };
    const action = (run: () => void) => () => {
      flushSync(onClose);
      run();
    };
    const result: Command[] = ROUTE_COMMANDS.map(([id, path, en, cn]) => ({
      id: `route-${id}`,
      label: zh ? cn : en,
      keywords: `${en} ${cn} ${path}`,
      category: zh ? '工具' : 'Tools',
      run: () => go(path),
    }));
    result.push(
      ...TRYON_MATERIALS.map((material) => ({
        id: `material-${material.id}`,
        label: zh ? material.titleZh : material.title,
        keywords: `${material.title} ${material.titleZh} ${material.description} ${material.descriptionZh} ${material.role} ${material.id}`,
        category: zh ? '素材' : 'Materials',
        run: () => go(`${ROUTES.MATERIALS}/${material.id}`),
      })),
    );
    result.push(
      ...workspace.map((command) => ({
        id: `workspace-${command.id}`,
        label: command.label,
        keywords: command.label,
        category: zh ? '目前工作區' : 'Current workspace',
        run: action(command.onSelect),
      })),
    );
    result.push(
      {
        id: 'basket',
        label: zh ? '開啟素材籃' : 'Open material basket',
        keywords: 'basket references 素材籃',
        category: zh ? '操作' : 'Actions',
        run: action(basket.openBasket),
      },
      {
        id: 'settings',
        label: zh ? '開啟設定' : 'Open settings',
        keywords: 'settings provider api key 設定 金鑰 供應商',
        category: zh ? '操作' : 'Actions',
        run: action(openSettingsPanel),
      },
    );
    for (const [theme, en, cn] of [
      ['bloom', 'Bloom', '繁花'],
      ['night', 'Night', '夜幕'],
      ['newyear', 'New Year', '新年'],
    ] as const) {
      result.push({
        id: `theme-${theme}`,
        label: zh ? `切換${cn}主題` : `Use ${en} theme`,
        keywords: `theme appearance ${theme} ${en} ${cn} 主題 外觀`,
        category: zh ? '外觀' : 'Appearance',
        run: action(() => setTheme(theme as ThemeType)),
      });
    }
    result.push(
      {
        id: 'language-en',
        label: 'Use English',
        keywords: 'language english 英文 語言',
        category: zh ? '語言' : 'Language',
        run: action(() => setLanguage('en')),
      },
      {
        id: 'language-zh',
        label: '使用繁體中文',
        keywords: 'language chinese 繁體中文 語言',
        category: zh ? '語言' : 'Language',
        run: action(() => setLanguage('zh-TW')),
      },
    );
    return result;
  }, [zh, t, navigate, onClose, workspace, basket.openBasket, setTheme, setLanguage]);
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = commands.filter((command) =>
    terms.every((term) =>
      `${command.label} ${command.keywords}`.toLocaleLowerCase().includes(term),
    ),
  );
  const activeIndex = Math.min(active, Math.max(0, filtered.length - 1));
  const selected = filtered[activeIndex];
  useEffect(() => {
    document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, listId, query]);
  return (
    <dialog
      ref={dialog}
      className="command-palette"
      data-testid="command-palette"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="command-palette__heading">
        <h2 id={titleId}>{zh ? '命令面板' : 'Command palette'}</h2>
        <button type="button" className="tool-button tool-button-secondary" onClick={onClose}>
          {zh ? '關閉' : 'Close'}
        </button>
      </header>
      <label className="command-palette__label" htmlFor={`${titleId}-search`}>
        {zh ? '搜尋命令' : 'Search commands'}
      </label>
      <input
        ref={input}
        id={`${titleId}-search`}
        data-testid="command-palette-search"
        className="command-palette__search"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={selected ? `${listId}-${activeIndex}` : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) =>
              filtered.length
                ? (Math.min(current, filtered.length - 1) +
                    (event.key === 'ArrowDown' ? 1 : -1) +
                    filtered.length) %
                  filtered.length
                : 0,
            );
          }
          if (event.key === 'Enter' && selected) {
            event.preventDefault();
            selected.run();
          }
        }}
      />
      <div
        id={listId}
        role="listbox"
        aria-label={zh ? '命令結果' : 'Command results'}
        className="command-palette__results"
      >
        {filtered.map((command, index) => (
          <div
            key={command.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            data-testid={`command-palette-result-${command.id}`}
            className="command-palette__result"
            onPointerMove={() => setActive(index)}
            onClick={command.run}
          >
            <span>{command.label}</span>
            <span className="command-palette__category">{command.category}</span>
          </div>
        ))}
      </div>
      {!filtered.length && (
        <p className="command-palette__empty" role="status">
          {zh ? '找不到符合的工具或素材。' : 'No matching tools or materials.'}
        </p>
      )}
      <p className="command-palette__hint">
        {zh ? '↑ ↓ 選擇 · Enter 開啟 · Esc 關閉' : '↑ ↓ Select · Enter Open · Esc Close'}
      </p>
    </dialog>
  );
}
