/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * History page for viewing all generation history.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '../hooks/useHistory';
import { useLanguage } from '../contexts/LanguageContext';
import { dataURLtoFile } from '../utils/fileUtils';
import StartTabNav from '../components/StartTabNav';

interface HistoryPageProps {
  onImageSelected: (file: File) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { history, removeFromHistory, clearHistory, getHistoryByType } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const handleDownload = (result: string, type: string) => {
    const link = document.createElement('a');
    link.href = result;
    link.download = `${type}-${Date.now()}.png`;
    link.click();
  };

  const handleEdit = (result: string) => {
    const file = dataURLtoFile(result, `history-${Date.now()}.png`);
    onImageSelected(file);
  };

  const handleDelete = (itemId: string) => {
    if (confirm(t('history.confirm_delete'))) {
      removeFromHistory(itemId);
    }
  };

  const handleBatchDownload = async () => {
    if (filteredHistory.length === 0) return;

    try {
      // Use JSZip if available
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      filteredHistory.forEach((item, index) => {
        const base64 = item.result.split(',')[1];
        zip.file(`${item.type}-${index + 1}.png`, base64, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `history-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // Fallback: download individually
      filteredHistory.forEach((item, index) => {
        setTimeout(() => handleDownload(item.result, item.type), index * 100);
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl">
          {t('history.title')}
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t('history.subtitle')}
        </p>

        <StartTabNav currentTab="history" navigate={navigate} />

        {/* Controls */}
        <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('history.search_placeholder')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter and View Mode */}
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('history.filter_all')}</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`history.type.${type}`) || type}
                </option>
              ))}
            </select>

            <div className="flex bg-gray-800 rounded-lg border border-gray-700 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ☰
              </button>
            </div>

            {filteredHistory.length > 0 && (
              <button
                onClick={handleBatchDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                {t('history.batch_download')}
              </button>
            )}

            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(t('history.confirm_clear_all'))) {
                    clearHistory();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                {t('history.clear_all')}
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-20 text-center text-gray-500">
            <span className="text-8xl mb-4">📭</span>
            <p className="text-xl mb-2">{t('history.empty')}</p>
            {searchQuery && <p className="text-sm">{t('history.no_results')}</p>}
          </div>
        ) : (
          <div
            className={`w-full ${
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-4'
            }`}
          >
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`group relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 hover:border-gray-600 transition-all ${
                  viewMode === 'list' ? 'flex gap-4' : ''
                }`}
              >
                <div className={`${viewMode === 'list' ? 'w-32 flex-shrink-0' : 'w-full'} h-48 overflow-hidden`}>
                  <img
                    src={item.result}
                    alt={`${item.type} result`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={`flex-1 p-4 ${viewMode === 'list' ? '' : 'absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2'}`}>
                  {viewMode === 'list' ? (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-400 uppercase">
                            {t(`history.type.${item.type}`) || item.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(item.timestamp)}
                          </span>
                        </div>
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="text-xs text-gray-400 mb-2">
                            {JSON.stringify(item.options)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(item.result, item.type)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          {t('history.download')}
                        </button>
                        <button
                          onClick={() => handleEdit(item.result)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          {t('history.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          {t('history.delete')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDownload(item.result, item.type)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        💾 {t('history.download')}
                      </button>
                      <button
                        onClick={() => handleEdit(item.result)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        ✏️ {t('history.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        🗑️ {t('history.delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {filteredHistory.length > 0 && (
          <div className="text-sm text-gray-400">
            {t('history.count').replace('{count}', String(filteredHistory.length)).replace('{total}', String(history.length))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
