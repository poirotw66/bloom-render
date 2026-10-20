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
import { UI_BTN_GENERATE, UI_BTN_UPLOAD, UI_FILE_PICKER } from '../utils/uiClasses';

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
  icon = '📸',
  canGenerate = true,
  className = '',
  uploadInputId = 'generic-image-upload',
  quantity = 1,
  imageSize,
  showCostEstimate = true,
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const zoneRef = useRef<HTMLDivElement>(null);

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

  usePasteImage(zoneRef, emitFile, { enabled: !isDemoMode });

  const handleDragOver = (e: React.DragEvent) => {
    if (isDemoMode) {
      e.preventDefault();
      return;
    }
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isDemoMode) {
      e.preventDefault();
      return;
    }
    onDrop(e);
  };

  return (
    <div className={`flex flex-col gap-4 w-full max-w-2xl mx-auto ${className}`}>
      <div
        ref={zoneRef}
        tabIndex={isDemoMode ? undefined : 0}
        role="group"
        aria-label={t(uploadHintKey)}
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          isDraggingOver && !isDemoMode
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
            : previewUrl
              ? 'border-gray-700 bg-gray-800/20'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/10'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={isDemoMode ? undefined : onDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="relative w-full max-w-md">
              <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-xl shadow-xl" />
              {isDemoMode && (
                <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-sky-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                  {t('demo.sample_input')}
                </span>
              )}
            </div>

            {error && <ErrorDisplay message={error} />}

            <div className="flex items-center gap-4">
              {!isDemoMode && (
                <label className={UI_FILE_PICKER}>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                    aria-label={t(changePhotoKey)}
                  />
                  {t(changePhotoKey)}
                </label>
              )}

              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={loading || !canGenerate}
                  className={UI_BTN_GENERATE}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      {t('start.idphoto_generating')}
                    </>
                  ) : (
                    <>
                      <span>{icon}</span>
                      {t(generateButtonKey)}
                    </>
                  )}
                </button>
                {showCostEstimate && (
                  <CostEstimateBadge quantity={quantity} imageSize={imageSize} />
                )}
              </div>
            </div>
            {isDemoMode && (
              <p className="text-xs text-sky-200/80 text-center max-w-sm">
                {t('demo.sample_only_hint')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <span className="text-4xl">{icon}</span>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 max-w-xs">
                {isDemoMode ? t('demo.loading_sample') : t(uploadHintKey)}
              </p>
            </div>

            {error && <ErrorDisplay message={error} />}

            {!isDemoMode && (
              <>
                <label htmlFor={uploadInputId} className={UI_BTN_UPLOAD}>
                  <span className="mr-3">{icon}</span>
                  {t('start.upload_button')}
                </label>
                <input
                  id={uploadInputId}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                  aria-label={t('start.upload_button')}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericUploadSection;
