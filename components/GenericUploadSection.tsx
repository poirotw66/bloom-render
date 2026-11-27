/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Generic upload section component for generate pages.
 */

import React, { useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePasteImage } from '../hooks/usePasteImage';
import CostEstimateBadge from './CostEstimateBadge';
import { ErrorDisplay } from './ErrorDisplay';
import { UI_BTN_GENERATE, UI_BTN_SECONDARY } from '../utils/uiClasses';
import '../styles/tool-controls.css';

interface GenericUploadSectionProps {
  previewUrl: string | null;
  error: string | null;
  loading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  uploadHintKey?: string;
  generateButtonKey?: string;
  changePhotoKey?: string;
  icon?: string;
  canGenerate?: boolean;
  className?: string;
  uploadInputId?: string;
  /** For cost estimate next to the generate button. */
  quantity?: number;
  imageSize?: string | null;
  showCostEstimate?: boolean;
  children?: React.ReactNode;
}

const GenericUploadSection: React.FC<GenericUploadSectionProps> = ({
  previewUrl,
  error,
  loading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
  uploadHintKey = 'start.upload_drag',
  generateButtonKey = 'start.idphoto_generate_btn',
  changePhotoKey = 'start.idphoto_change_photo',
  icon = '',
  canGenerate = true,
  className = '',
  uploadInputId = 'generic-image-upload',
  quantity = 1,
  imageSize,
  showCostEstimate = true,
  children,
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const zoneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = !isDemoMode && !loading;

  const emitFile = useCallback(
    (file: File) => {
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: dt.files });
      onFileChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [onFileChange],
  );

  usePasteImage(zoneRef, emitFile, { enabled: canUpload });

  const handleDragOver = (e: React.DragEvent) => {
    if (!canUpload) {
      e.preventDefault();
      return;
    }
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canUpload) {
      e.preventDefault();
      return;
    }
    onDrop(e);
  };

  return (
    <div className={`tool-upload-section w-full max-w-2xl mx-auto ${className}`}>
      <div
        ref={zoneRef}
        tabIndex={canUpload ? 0 : undefined}
        role="group"
        aria-label={t(uploadHintKey)}
        aria-busy={loading}
        className={`tool-upload-zone theme-border theme-raised ${
          isDraggingOver && canUpload ? 'tool-upload-zone--dragging' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={canUpload ? onDragLeave : undefined}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="tool-upload-preview">
            <img src={previewUrl} alt="Preview" />
            {isDemoMode && (
              <span className="tool-upload-demo brand-bg text-white">{t('demo.sample_input')}</span>
            )}
          </div>
        ) : (
          <p className="theme-ink-muted">
            {isDemoMode ? t('demo.loading_sample') : t(uploadHintKey)}
          </p>
        )}
        {error && <ErrorDisplay message={error} />}
        {!isDemoMode && (
          <button
            type="button"
            disabled={loading}
            className={UI_BTN_SECONDARY}
            onClick={() => inputRef.current?.click()}
          >
            {t(previewUrl ? changePhotoKey : 'start.upload_button')}
          </button>
        )}
        {children && <div className="tool-upload-settings">{children}</div>}
        {previewUrl && (
          <div className="tool-upload-actions">
            <div className="tool-upload-generate">
              <button
                type="button"
                onClick={onGenerate}
                disabled={loading || !canGenerate}
                className={UI_BTN_GENERATE}
              >
                {loading ? (
                  <>
                    <span className="animate-spin" aria-hidden="true">
                      ⏳
                    </span>
                    {t('start.idphoto_generating')}
                  </>
                ) : (
                  <>
                    {icon ? <span aria-hidden="true">{icon}</span> : null}
                    {t(generateButtonKey)}
                  </>
                )}
              </button>
              {showCostEstimate && <CostEstimateBadge quantity={quantity} imageSize={imageSize} />}
            </div>
          </div>
        )}
        {!isDemoMode && (
          <input
            ref={inputRef}
            id={uploadInputId}
            type="file"
            hidden
            accept="image/*"
            disabled={loading}
            onChange={onFileChange}
            aria-label={t(previewUrl ? changePhotoKey : 'start.upload_button')}
          />
        )}
        {isDemoMode && previewUrl && (
          <p className="text-sm brand-text-soft">{t('demo.sample_only_hint')}</p>
        )}
      </div>
    </div>
  );
};

export default GenericUploadSection;
