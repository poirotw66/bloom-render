/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useLanguage } from '../contexts/LanguageContext';
import { getPendingHistoryItems, useHistoryStorageStatus } from '../hooks/useHistory';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { UI_BTN_SECONDARY } from '../utils/uiClasses';

/** Storage failures stay visible across routes without loading history on the homepage. */
export default function HistoryStorageNotice({ onManage }: { onManage?: () => void }) {
  const { t } = useLanguage();
  const { issue, pendingCount, isRetrying, retryHistoryStorage } = useHistoryStorageStatus();
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  if (!issue && pendingCount === 0 && !isRetrying) return null;

  const downloadPending = async () => {
    setDownloading(true);
    setDownloadFailed(false);
    try {
      const items = getPendingHistoryItems();
      const { downloadBatchWithZipFallback } = await import('../utils/downloadHelpers');
      await downloadBatchWithZipFallback({
        sources: items.map((item) => item.blob),
        itemFileName: (index) => {
          const type = items[index].blob.type;
          const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
          return `unsaved-image-${index + 1}.${extension}`;
        },
        zipFileName: `bloomrender-unsaved-${Date.now()}.zip`,
      });
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <aside
      role="alert"
      aria-label={t('history.storage.title')}
      className="w-full max-w-3xl mx-auto rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 mb-4 text-left"
      data-testid="history-storage-notice"
    >
      <p className="font-semibold theme-ink">{t('history.storage.title')}</p>
      {issue && (
        <p className="mt-2 text-sm theme-ink-muted">{t(`history.storage.${issue.kind}`)}</p>
      )}
      {issue && ['delete', 'clear', 'retention'].includes(issue.operation) && (
        <p className="mt-2 text-sm theme-ink-muted">
          {t(`history.storage.operation.${issue.operation}`)}
        </p>
      )}
      {pendingCount > 0 && (
        <p className="mt-2 text-sm theme-ink-muted">
          {t('history.storage.pending', { count: pendingCount })}
        </p>
      )}
      {downloadFailed && (
        <p className="mt-2 text-sm text-red-300">{t('history.storage.download_failed')}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          className={UI_BTN_SECONDARY}
          disabled={isRetrying}
          onClick={() => {
            setDownloadFailed(false);
            void retryHistoryStorage();
          }}
        >
          {t(isRetrying ? 'history.storage.retrying' : 'history.storage.retry')}
        </button>
        {pendingCount > 0 && (
          <button
            type="button"
            className={UI_BTN_SECONDARY}
            disabled={downloading || isRetrying}
            onClick={() => void downloadPending()}
          >
            {t('history.storage.download', { count: pendingCount })}
          </button>
        )}
        <Link
          to={ROUTES.HISTORY}
          className={UI_BTN_SECONDARY}
          onClick={(event) => {
            if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) {
              event.preventDefault();
              return;
            }
            onManage?.();
          }}
        >
          {t('history.storage.manage')}
        </Link>
      </div>
    </aside>
  );
}
