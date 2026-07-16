/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHistory, type HistoryItem } from '../../hooks/useHistory';
import { dataURLtoFile } from '../../utils/fileUtils';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';

interface HistoryPageProps {
  onImageSelected: (file: File) => void;
}

const HISTORY_TYPES = ['all', 'idphoto', 'portrait', 'themed', 'travel', 'couple', 'group'] as const;

type HistoryFilterType = (typeof HISTORY_TYPES)[number];

function formatRelativeTime(timestamp: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
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

  const surface =
    theme === 'newyear'
      ? 'bg-red-900/30 border-red-700/50 shadow-red-900/25'
      : theme === 'bloom'
        ? 'bg-gray-900/40 border-fuchsia-500/15 shadow-fuchsia-500/10'
        : 'bg-black/60 border-slate-700/60 shadow-slate-900/30';

  const accent =
    theme === 'newyear'
      ? 'text-red-200'
      : theme === 'bloom'
        ? 'text-fuchsia-200'
        : 'text-blue-200';

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
    link.href = item.result;
    link.download = `${item.type}-${index + 1}.png`;
    link.click();
  };

  const handleDownloadFiltered = async (): Promise<void> => {
    await downloadBatchWithZipFallback({
      dataUrls: filteredHistory.map((item) => item.result),
      itemFileName: (index) => `${filteredHistory[index].type}-${index + 1}.png`,
      zipFileName: `history-${Date.now()}.zip`,
    });
  };

  const handleEdit = (item: HistoryItem, index: number): void => {
    onImageSelected(dataURLtoFile(item.result, `${item.type}-${index + 1}.png`));
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
    <div
      className={`w-full max-w-6xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 shadow-xl backdrop-blur-xl ${surface}`}
    >
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
            <span className={accent}>{t('history.title')}</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-300 md:text-xl leading-relaxed">
            {t('history.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('history.search_placeholder')}
            className="w-full lg:max-w-md bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            {filteredHistory.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadFiltered}
                className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
              >
                {t('history.batch_download')}
              </button>
            )}
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
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
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
                  isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
                }`}
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
              <article
                key={item.id}
                className="bg-gray-900/55 border border-gray-700/70 rounded-2xl overflow-hidden shadow-lg"
              >
                <div className="aspect-square bg-gray-950 flex items-center justify-center">
                  <img
                    src={item.result}
                    alt={`${t(`history.type.${item.type}`)} ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">{t(`history.type.${item.type}`)}</h2>
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
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
                    >
                      {t('history.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadOne(item, index)}
                      className="px-4 py-2 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
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
