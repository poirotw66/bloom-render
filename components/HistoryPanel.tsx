/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * History panel component for viewing generation history.
 */

import React, { useState, useMemo } from 'react';
import { useHistory } from '../hooks/useHistory';
import { useLanguage } from '../contexts/LanguageContext';
import { dataURLtoFile } from '../utils/fileUtils';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected?: (file: File) => void;
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  onImageSelected,
  className = '',
}) => {
  const { t } = useLanguage();
  const { history, removeFromHistory, clearHistory, getHistoryByType } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    let filtered = filterType === 'all' ? history : getHistoryByType(filterType);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const typeMatch = item.type.toLowerCase().includes(query);
        const optionsMatch = item.options ? JSON.stringify(item.options).toLowerCase().includes(query) : false;
        return typeMatch || optionsMatch;
      });
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [history, filterType, searchQuery, getHistoryByType]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(history.map((item) => item.type));
    return Array.from(types);
  }, [history]);

  const handleDownload = (itemId: string, result: string, type: string) => {
    const link = document.createElement('a');
    link.href = result;
    link.download = `${type}-${Date.now()}.png`;
    link.click();
  };

  const handleEdit = (itemId: string, result: string) => {
    if (onImageSelected) {
      const file = dataURLtoFile(result, `history-${itemId}.png`);
      onImageSelected(file);
      onClose();
    }
  };

  const handleDelete = (itemId: string) => {
    if (confirm(t('history.confirm_delete'))) {
      removeFromHistory(itemId);
      if (selectedItem === itemId) {
        setSelectedItem(null);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('history.just_now');
    if (diffMins < 60) return t('history.minutes_ago').replace('{count}', String(diffMins));
    if (diffHours < 24) return t('history.hours_ago').replace('{count}', String(diffHours));
    if (diffDays < 7) return t('history.days_ago').replace('{count}', String(diffDays));
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{t('history.title')}</h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(t('history.confirm_clear_all'))) {
                    clearHistory();
                    setSelectedItem(null);
                  }
                }}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                {t('history.clear_all')}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              aria-label={t('history.close')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-gray-700 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('history.search_placeholder')}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t('history.filter_all')}
            </button>
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {t(`history.type.${type}`) || type}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <span className="text-6xl mb-4">📭</span>
              <p className="text-lg">{t('history.empty')}</p>
              {searchQuery && (
                <p className="text-sm mt-2">{t('history.no_results')}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className={`group relative bg-gray-800 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedItem === item.id
                      ? 'border-blue-500 scale-105'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
                >
                  <img
                    src={item.result}
                    alt={`${item.type} result`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-400 uppercase">
                        {t(`history.type.${item.type}`) || item.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Actions on hover/select */}
                  {(selectedItem === item.id || true) && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item.id, item.result, item.type);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        title={t('history.download')}
                      >
                        💾
                      </button>
                      {onImageSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item.id, item.result);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          title={t('history.edit')}
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        title={t('history.delete')}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400 text-center">
          {t('history.count').replace('{count}', String(filteredHistory.length)).replace('{total}', String(history.length))}
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
