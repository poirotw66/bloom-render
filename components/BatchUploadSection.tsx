/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Batch upload section component for multiple file uploads.
 */

import React, { useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePasteImage } from '../hooks/usePasteImage';
import { ErrorDisplay } from './ErrorDisplay';
import CostEstimateBadge from './CostEstimateBadge';
import { XMarkIcon } from './icons';
import { UI_BTN_GENERATE, UI_BTN_SECONDARY } from '../utils/uiClasses';
import '../styles/tool-controls.css';

interface BatchUploadSectionProps {
  files: File[];
  previewUrls: string[];
  error: string | null;
  loading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onRemoveFile: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  maxFiles?: number;
  minFiles?: number;
  icon?: string;
  className?: string;
}

const BatchUploadSection: React.FC<BatchUploadSectionProps> = ({
  files,
  previewUrls,
  error,
  loading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onRemoveFile,
  onDragOver,
  onDragLeave,
  onDrop,
  maxFiles = 10,
  minFiles = 1,
  className = '',
}) => {
  const { t } = useLanguage();
  const zoneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = files.length < maxFiles && !loading;
  const canGenerate = files.length >= minFiles && files.length <= maxFiles && !loading;

  const emitFile = useCallback(
    (file: File) => {
      if (!canAddMore) return;
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.createElement('input');
      input.type = 'file';
      // DataTransfer.files is read-only on some engines; multiple via change with one file is fine.
      Object.defineProperty(input, 'files', { value: dt.files });
      onFileChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [canAddMore, onFileChange],
  );

  usePasteImage(zoneRef, emitFile, { enabled: canAddMore });

  return (
    <div className={`flex flex-col gap-4 w-full max-w-4xl mx-auto ${className}`}>
      <div
        ref={zoneRef}
        tabIndex={loading ? undefined : 0}
        aria-busy={loading}
        role="group"
        aria-label={t('batch.title')}
        className={`tool-upload-zone theme-border theme-raised ${isDraggingOver && !loading ? 'tool-upload-zone--dragging' : ''}`}
        onDragOver={(event) => {
          if (loading) event.preventDefault();
          else onDragOver(event);
        }}
        onDragLeave={loading ? undefined : onDragLeave}
        onDrop={(event) => {
          if (!canAddMore) event.preventDefault();
          else onDrop(event);
        }}
      >
        {files.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-6">
            <h3 className="text-sm font-semibold theme-ink flex items-center gap-2">
              {t('batch.uploaded_files', { count: files.length, max: maxFiles })}
            </h3>

            {/* File Previews Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border theme-border theme-raised"
                >
                  <img src={url} alt={`File ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onRemoveFile(idx)}
                    className="tool-photo-remove"
                    aria-label={`${t('batch.remove_file')} ${idx + 1}`}
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 text-xs text-white text-center font-bold">
                    #{idx + 1}
                  </div>
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  className="aspect-square rounded-xl border border-dashed theme-border theme-raised theme-ink-muted flex flex-col items-center justify-center gap-2"
                  onClick={() => inputRef.current?.click()}
                >
                  <span className="text-2xl" aria-hidden="true">
                    +
                  </span>
                  <span className="text-sm">{t('batch.add_more')}</span>
                </button>
              )}
            </div>

            {error && <ErrorDisplay message={error} />}

            <div className="tool-upload-actions">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={!canGenerate}
                  className={UI_BTN_GENERATE}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      {t('batch.generating')}
                    </>
                  ) : (
                    t('batch.generate_all').replace('{count}', String(files.length))
                  )}
                </button>
                <CostEstimateBadge quantity={Math.max(1, files.length)} />
              </div>
            </div>

            <p className="text-sm theme-ink-muted max-w-sm text-center">
              {t('batch.hint')
                .replace('{min}', String(minFiles))
                .replace('{max}', String(maxFiles))}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm theme-ink-muted max-w-xs leading-relaxed">
              {t('batch.upload_hint')
                .replace('{min}', String(minFiles))
                .replace('{max}', String(maxFiles))}
            </p>
            <button
              type="button"
              disabled={loading}
              className={UI_BTN_SECONDARY}
              onClick={() => inputRef.current?.click()}
            >
              {t('batch.upload_button')}
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          id="batch-image-upload"
          type="file"
          hidden
          accept="image/*"
          multiple
          disabled={!canAddMore}
          onChange={onFileChange}
          aria-label={t(files.length ? 'batch.add_more' : 'batch.upload_button')}
        />
      </div>
    </div>
  );
};

export default BatchUploadSection;
