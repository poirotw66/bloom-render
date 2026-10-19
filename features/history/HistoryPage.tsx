/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHistory, type HistoryItem } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import HistoryResultCard from '../../components/HistoryResultCard';
import {
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
  UI_INPUT,
  UI_PAGE_WIDE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

interface HistoryPageProps {
  onImageSelected: (file: File) => void;
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

const HistoryPage: React.FC<HistoryPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { history, removeFromHistory, clearHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<HistoryFilterType>('all');

  const filteredHistory = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return history.filter((item) => {
      const matchesType = activeType === 'all' || item.type === activeType;
      const matchesQuery =
        normalizedQuery.length === 0 || buildHistorySearchText(item).includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [activeType, history, searchQuery]);

  const handleDownloadFiltered = async (): Promise<void> => {
    await downloadBatchWithZipFallback({
      sources: filteredHistory.map((item) => item.blob),
      itemFileName: (index) => `${filteredHistory[index].type}-${index + 1}.png`,
      zipFileName: `history-${Date.now()}.zip`,
    });
  };

  const handleEdit = (item: HistoryItem, index: number): void => {
    onImageSelected(
      new File([item.blob], `${item.type}-${index + 1}.png`, { type: item.blob.type }),
    );
  };

  const handleRemove = (itemId: string): void => {
    if (window.confirm(t('history.confirm_delete'))) {
      removeFromHistory(itemId);
    }
  };

  const handleClearAll = (): void => {
    if (window.confirm(t('history.confirm_clear_all'))) {
      clearHistory();
    }
  };

  return (
    <div className={`${UI_PAGE_WIDE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="space-y-3">
          <h1 className={UI_TITLE}>
            <span className={getTitleAccent(theme)}>{t('history.title')}</span>
          </h1>
          <p className={UI_SUBTITLE}>{t('history.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('history.search_placeholder')}
            className={`w-full lg:max-w-md ${UI_INPUT}`}
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            {filteredHistory.length > 1 && (
              <button type="button" onClick={handleDownloadFiltered} className={UI_BTN_SUCCESS}>
                {t('history.batch_download')}
              </button>
            )}
            {history.length > 0 && (
              <button type="button" onClick={handleClearAll} className={UI_BTN_SECONDARY}>
                {t('history.clear_all')}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {HISTORY_TYPES.map((type) => {
            const label = type === 'all' ? t('history.filter_all') : t(`history.type.${type}`);
            const isActive = activeType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={isActive ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-400">
          {t('history.count', { count: filteredHistory.length, total: history.length })}
        </p>

        {history.length === 0 ? (
          <div className="py-16 text-gray-400">{t('history.empty')}</div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-gray-400">{t('history.no_results')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
            {filteredHistory.map((item, index) => (
              <HistoryResultCard
                key={item.id}
                item={item}
                index={index}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
