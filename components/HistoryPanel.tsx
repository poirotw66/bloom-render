/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDialog } from '../hooks/useDialog';
import { useHistory, type HistoryItem } from '../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../utils/downloadHelpers';
import HistoryResultCard from './HistoryResultCard';
import { XMarkIcon } from './icons';
import { ROUTES } from '../constants/routes';
import {
  UI_BTN_SUCCESS,
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
  UI_INPUT,
  getTitleAccent,
} from '../utils/uiClasses';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected?: (file: File) => void;
}

const HISTORY_TYPES = [
  'all',
  'generate',
  'editor',
  'idphoto',
  'portrait',
  'themed',
  'travel',
  'couple',
  'group',
  'tryon',
] as const;

type HistoryFilterType = (typeof HISTORY_TYPES)[number];

function buildHistorySearchText(item: HistoryItem): string {
  return [item.type, ...Object.values(item.options ?? {}).map(String)].join(' ').toLowerCase();
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { history, removeFromHistory, clearHistory } = useHistory();
  const panelRef = useDialog<HTMLElement>(isOpen, onClose);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<HistoryFilterType>('all');

  useEffect(() => {
    if (!isOpen) return;

    // Keep the panel focused on the latest user intent.
    setSearchQuery('');
    setActiveType('all');
  }, [isOpen]);

  const surface =
    theme === 'newyear'
      ? 'bg-red-900/95 border-red-700/50'
      : theme === 'bloom'
        ? 'bg-gray-900/95 brand-border-soft'
        : 'bg-gray-900/95 border-gray-700/60';

  const accent = getTitleAccent(theme);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return history.filter((item) => {
      const matchesType = activeType === 'all' || item.type === activeType;
      const matchesQuery =
        normalizedQuery.length === 0 || buildHistorySearchText(item).includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [activeType, history, searchQuery]);

  const handleRemove = (itemId: string) => {
    if (!window.confirm(t('history.confirm_delete'))) return;
    removeFromHistory(itemId);
  };

  const handleClearAll = () => {
    if (!window.confirm(t('history.confirm_clear_all'))) return;
    clearHistory();
  };

  const handleEdit = (item: HistoryItem, index: number) => {
    if (!onImageSelected) return;
    onImageSelected(
      new File([item.blob], `${item.type}-${index + 1}.png`, { type: item.blob.type }),
    );
    onClose();
  };

  const handleDownloadFiltered = async (): Promise<void> => {
    await downloadBatchWithZipFallback({
      sources: filteredHistory.map((item) => item.blob),
      itemFileName: (index) => `${filteredHistory[index].type}-${index + 1}.png`,
      zipFileName: `history-${Date.now()}.zip`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />

      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`absolute right-0 top-0 h-full w-full max-w-lg border-l flex flex-col focus:outline-none ${surface} animate-slide-in-right`}
        role="dialog"
        aria-modal="true"
        aria-label={t('history.title')}
      >
        <div className="shrink-0 p-5 border-0 border-white/10 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className={`text-xl font-extrabold ${accent}`}>{t('history.title')}</h2>
            <p className="text-sm text-gray-300">{t('history.subtitle')}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t('history.close')}
            title={t('history.close')}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="shrink-0 p-5 border-0 border-white/10 space-y-4">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('history.search_placeholder')}
            aria-label={t('history.search_placeholder')}
            className={UI_INPUT}
          />

          <div className="flex flex-wrap gap-2" role="group" aria-label={t('history.filter_all')}>
            {HISTORY_TYPES.map((type) => {
              const label = type === 'all' ? t('history.filter_all') : t(`history.type.${type}`);
              const isActive = activeType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  aria-pressed={isActive}
                  className={isActive ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              {t('history.count', { count: filteredHistory.length, total: history.length })}
            </p>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-gray-200 hover:text-white transition-colors underline underline-offset-4"
              >
                {t('history.clear_all')}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              {filteredHistory.length > 1 && (
                <button type="button" onClick={handleDownloadFiltered} className={UI_BTN_SUCCESS}>
                  {t('history.batch_download')}
                </button>
              )}
            </div>

            <Link
              to={ROUTES.HISTORY}
              className="text-xs text-gray-200 hover:text-white transition-colors underline underline-offset-4"
              onClick={onClose}
            >
              {t('history.view_all')}
            </Link>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
          {history.length === 0 ? (
            <div className="py-16 text-center text-gray-300">{t('history.empty')}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-300">{t('history.no_results')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredHistory.map((item, index) => (
                <HistoryResultCard
                  key={item.id}
                  item={item}
                  index={index}
                  compact
                  onEdit={onImageSelected ? handleEdit : undefined}
                  onRemove={handleRemove}
                  onAfterNavigate={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default HistoryPanel;
