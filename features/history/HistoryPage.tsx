/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHistory, type HistoryItem } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import HistoryResultCard from '../../components/HistoryResultCard';
import HistoryResultBrowser from '../../components/HistoryResultBrowser';
import { visibleHistorySelection } from '../../utils/posewearHistorySelection';
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
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { history, removeFromHistory, clearHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<HistoryFilterType>('all');
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [exportError, setExportError] = useState(false);
  const exportLock = useRef(false);
  const chinese = language === 'zh-TW';

  const handleExport = async (items = filteredHistory, imagesOnly = false): Promise<void> => {
    if (exportLock.current || !items.length) return;
    const snapshot = [...items];
    exportLock.current = true;
    setExporting(true);
    setExportError(false);
    try {
      if (imagesOnly) {
        await downloadBatchWithZipFallback({
          sources: snapshot.map((item) => item.blob),
          itemFileName: (index) => `${snapshot[index].type}-${index + 1}.png`,
          zipFileName: `history-selected-${Date.now()}.zip`,
        });
      } else {
        const { downloadHistoryArchive } = await import('../../utils/historyArchive');
        await downloadHistoryArchive(snapshot);
      }
    } catch {
      setExportError(true);
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return history.filter((item) => {
      const matchesType = activeType === 'all' || item.type === activeType;
      const matchesQuery =
        normalizedQuery.length === 0 || buildHistorySearchText(item).includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [activeType, history, searchQuery]);

  const visibleIds = filteredHistory.map((item) => item.id);
  const selectedVisibleIds = visibleHistorySelection(selectedIds, visibleIds);
  const selectedHistory = filteredHistory.filter((item) => selectedVisibleIds.includes(item.id));
  const selectionKey = JSON.stringify(visibleIds);
  useEffect(() => {
    const visible: string[] = JSON.parse(selectionKey);
    setSelectedIds((current) => {
      const next = visibleHistorySelection(current, visible);
      return next.length === current.length ? current : next;
    });
  }, [selectionKey]);

  const handleDownloadFiltered = async (): Promise<void> => {
    await handleExport(filteredHistory, true);
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
              <button
                type="button"
                onClick={handleDownloadFiltered}
                disabled={exporting}
                className={UI_BTN_SUCCESS}
              >
                {t('history.batch_download')}
              </button>
            )}
            {filteredHistory.length > 0 && (
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={exporting}
                className={`${UI_BTN_SECONDARY} disabled:opacity-50`}
              >
                {exporting
                  ? chinese
                    ? '匯出中…'
                    : 'Exporting…'
                  : chinese
                    ? '匯出圖片與配方'
                    : 'Export images and recipes'}
              </button>
            )}
            {history.length > 0 && (
              <button type="button" onClick={handleClearAll} className={UI_BTN_SECONDARY}>
                {t('history.clear_all')}
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-3"
            data-testid="history-selection-toolbar"
          >
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              onClick={() => setSelectedIds(visibleIds)}
            >
              {chinese ? '全選目前結果' : 'Select visible'}
            </button>
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              disabled={!selectedHistory.length}
              onClick={() => setSelectedIds([])}
            >
              {chinese ? '取消全選' : 'Deselect all'}
            </button>
            <span role="status" className="text-sm theme-ink-muted">
              {chinese ? `已選 ${selectedHistory.length} 項` : `${selectedHistory.length} selected`}
            </span>
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              disabled={exporting || !selectedHistory.length}
              onClick={() => void handleExport(selectedHistory, true)}
            >
              {chinese ? '下載勾選圖片' : 'Download selected images'}
            </button>
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              disabled={exporting || !selectedHistory.length}
              onClick={() => void handleExport(selectedHistory)}
            >
              {chinese ? '匯出勾選圖片與配方' : 'Export selected images and recipes'}
            </button>
          </div>
        )}
        {filteredHistory.length > 0 && (
          <p className="text-sm theme-ink-muted">
            {chinese
              ? '配方匯出包含原始照片與參考圖，請妥善保管。舊紀錄可能缺少部分輸入。'
              : 'Recipe exports include original photos and reference images. Keep them private. Older records may have missing inputs.'}
          </p>
        )}
        {exportError && (
          <p role="alert" className="text-sm text-red-300">
            {chinese ? '匯出失敗，請重試。' : 'Export failed. Please try again.'}
          </p>
        )}

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

        <p className="text-sm theme-ink-muted">
          {t('history.count', { count: filteredHistory.length, total: history.length })}
        </p>

        {history.length === 0 ? (
          <div className="py-16 rounded-2xl border theme-border theme-raised theme-ink-muted">
            {t('history.empty')}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 rounded-2xl border theme-border theme-raised theme-ink-muted">
            {t('history.no_results')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
            {filteredHistory.map((item, index) => (
              <div key={item.id} className="min-w-0">
                <label className="flex min-h-11 items-center gap-2 px-2 text-sm theme-ink-muted">
                  <input
                    type="checkbox"
                    data-testid={`history-select-${item.id}`}
                    checked={selectedVisibleIds.includes(item.id)}
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id),
                      )
                    }
                  />
                  {chinese ? `選取結果 ${index + 1}` : `Select result ${index + 1}`}
                </label>
                <HistoryResultCard
                  item={item}
                  index={index}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
                  onView={setViewerId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {viewerId && (
        <HistoryResultBrowser
          items={filteredHistory}
          initialId={viewerId}
          onClose={() => setViewerId(null)}
        />
      )}
    </div>
  );
};

export default HistoryPage;
