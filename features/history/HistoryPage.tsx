/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHistory, type HistoryItem } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import {
  UI_BTN_PRIMARY,
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_CARD_SOFT,
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
  'idphoto',
  'portrait',
  'themed',
  'travel',
  'couple',
  'group',
  'tryon',
] as const;

type HistoryFilterType = (typeof HISTORY_TYPES)[number];

function formatRelativeTime(
  timestamp: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return t('history.just_now');
  if (diffMinutes < 60) return t('history.minutes_ago', { count: diffMinutes });

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t('history.hours_ago', { count: diffHours });

  return t('history.days_ago', { count: Math.floor(diffHours / 24) });
}

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

  const handleDownloadOne = (item: HistoryItem, index: number): void => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `${item.type}-${index + 1}.png`;
    link.click();
  };

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
              <article key={item.id} className={UI_CARD_SOFT}>
                <div className="aspect-square bg-gray-950 flex items-center justify-center">
                  <img
                    src={item.url}
                    alt={`${t(`history.type.${item.type}`)} ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {t(`history.type.${item.type}`)}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {formatRelativeTime(item.timestamp, t)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-sm text-red-300 hover:text-red-200 transition-colors"
                    >
                      {t('history.delete')}
                    </button>
                  </div>

                  {item.options && Object.keys(item.options).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.options).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(item, index)}
                      className={UI_BTN_PRIMARY}
                    >
                      {t('history.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadOne(item, index)}
                      className={UI_BTN_SECONDARY}
                    >
                      {t('history.download')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
