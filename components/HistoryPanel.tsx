/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useHistory, type HistoryItem } from '../hooks/useHistory';
import { dataURLtoFile } from '../utils/fileUtils';
import { downloadBatchWithZipFallback } from '../utils/downloadHelpers';
import { DownloadIcon, EditIcon, XMarkIcon } from './icons';
import { ROUTES } from '../constants/routes';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected?: (file: File) => void;
}

const HISTORY_TYPES = [
  'all',
  'idphoto',
  'portrait',
  'themed',
  'travel',
  'couple',
  'group',
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

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { history, removeFromHistory, clearHistory } = useHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<HistoryFilterType>('all');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        ? 'bg-gray-900/95 border-fuchsia-500/20'
        : 'bg-gray-900/95 border-gray-700/60';

  const accent =
    theme === 'newyear' ? 'text-red-200' : theme === 'bloom' ? 'text-fuchsia-200' : 'text-blue-200';

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
    onImageSelected(dataURLtoFile(item.result, `${item.type}-${index + 1}.png`));
    onClose();
  };

  const handleDownloadOne = (item: HistoryItem, index: number) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-lg border-l shadow-2xl ${surface} animate-fade-in`}
        role="dialog"
        aria-modal="true"
        aria-label={t('history.title')}
      >
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
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

        <div className="p-5 border-b border-white/10 space-y-4">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('history.search_placeholder')}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black"
          />

          <div className="flex flex-wrap gap-2">
            {HISTORY_TYPES.map((type) => {
              const label = type === 'all' ? t('history.filter_all') : t(`history.type.${type}`);
              const isActive = activeType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
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
                <button
                  type="button"
                  onClick={handleDownloadFiltered}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
                >
                  {t('history.batch_download')}
                </button>
              )}
            </div>

            <Link
              to={ROUTES.HISTORY}
              className="text-xs text-gray-200 hover:text-white transition-colors underline underline-offset-4"
              onClick={onClose}
            >
              {t('history.title')}
            </Link>
          </div>
        </div>

        <div className="p-5 overflow-auto h-[calc(100vh-220px)]">
          {history.length === 0 ? (
            <div className="py-16 text-center text-gray-300">{t('history.empty')}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-300">{t('history.no_results')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-gray-900/40 border border-white/10 rounded-2xl overflow-hidden"
                >
                  <div className="aspect-square bg-gray-950 flex items-center justify-center">
                    <img
                      src={item.result}
                      alt={`${t(`history.type.${item.type}`)} ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {t(`history.type.${item.type}`)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {formatRelativeTime(item.timestamp, t)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1 rounded-lg text-red-200 hover:text-red-100 hover:bg-red-500/10 transition-colors"
                        aria-label={t('history.delete')}
                        title={t('history.delete')}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item, index)}
                        disabled={!onImageSelected}
                        className={`flex-1 px-2 py-1 rounded-xl text-xs font-bold transition-colors ${
                          onImageSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          <EditIcon className="w-3.5 h-3.5" />
                          {t('history.edit')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadOne(item, index)}
                        className="flex-1 px-2 py-1 rounded-xl text-xs font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          <DownloadIcon className="w-3.5 h-3.5" />
                          {t('history.download')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default HistoryPanel;
