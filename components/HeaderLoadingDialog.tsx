/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useDialog } from '../hooks/useDialog';
import Spinner from './Spinner';

/** Keep modal keyboard, focus and scroll behavior while its code is downloading. */
export default function HeaderLoadingDialog({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="theme-surface theme-border rounded-xl border p-6 flex flex-col items-center gap-3"
      >
        <div role="status" aria-label={label}>
          <Spinner />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="theme-ink rounded-lg border theme-border px-4 py-2"
        >
          {t('history.close')}
        </button>
      </div>
    </div>
  );
}
