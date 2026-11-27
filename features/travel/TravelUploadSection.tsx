/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { usePasteImage } from '../../hooks/usePasteImage';
import CostEstimateBadge from '../../components/CostEstimateBadge';
import { TravelIcon, UserIcon, UsersIcon, XMarkIcon } from '../../components/icons';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { TRAVEL_PANEL } from './travelUi';

interface TravelUploadSectionProps {
  files: File[];
  previewUrls: string[];
  isGroupMode: boolean;
  setIsGroupMode: (v: boolean) => void;
  removeFile: (index: number) => void;
  error: string | null;
  loading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  quantity?: number;
  imageSize?: string | null;
}

const TravelUploadSection: React.FC<TravelUploadSectionProps> = ({
  files,
  previewUrls,
  isGroupMode,
  setIsGroupMode,
  removeFile,
  error,
  loading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
  quantity = 1,
  imageSize,
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const zoneRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const modeActive = 'bg-sky-700 text-white ';
  const modeIdle = 'theme-ink-muted hover:text-slate-300';

  const emitFile = useCallback(
    (file: File) => {
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: dt.files });
      onFileChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [onFileChange],
  );
  usePasteImage(zoneRef, emitFile, { enabled: !isDemoMode && !loading });

  return (
    <div
      id="travel-photo-section"
      className={`flex flex-col gap-4 w-full max-w-2xl mx-auto p-4 ${TRAVEL_PANEL}`}
    >
      <input
        ref={fileInput}
        id="image-upload-travel"
        type="file"
        hidden
        accept="image/*"
        multiple={isGroupMode}
        disabled={isDemoMode || loading}
        onChange={onFileChange}
        aria-label={t('start.upload_button')}
      />
      {isDemoMode && (
        <p className="text-xs text-sky-200/80 text-center">{t('demo.sample_only_hint')}</p>
      )}
      <div className="flex justify-center">
        <div
          className="inline-flex p-1 rounded-full border border-slate-700/60 bg-slate-950/80"
          role="group"
        >
          <button
            type="button"
            onClick={() => setIsGroupMode(false)}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-colors duration-200 flex items-center gap-2 cursor-pointer ${!isGroupMode ? modeActive : modeIdle}`}
            aria-pressed={!isGroupMode}
          >
            <UserIcon className="w-4 h-4" />
            {t('travel.mode.single')}
          </button>
          <button
            type="button"
            onClick={() => setIsGroupMode(true)}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-colors duration-200 flex items-center gap-2 cursor-pointer ${isGroupMode ? modeActive : modeIdle}`}
            aria-pressed={isGroupMode}
          >
            <UsersIcon className="w-4 h-4" />
            {t('travel.mode.group')}
          </button>
        </div>
      </div>

      <div
        ref={zoneRef}
        tabIndex={isDemoMode ? undefined : 0}
        role="group"
        aria-label={t('travel.upload_hint')}
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-colors duration-200 flex flex-col items-center justify-center gap-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          isDraggingOver && !isDemoMode
            ? 'border-sky-400 bg-sky-500/10'
            : files.length > 0
              ? 'border-slate-600 bg-slate-800/30'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/20'
        }`}
        onDragOver={isDemoMode ? (e) => e.preventDefault() : onDragOver}
        onDragLeave={isDemoMode ? undefined : onDragLeave}
        onDrop={isDemoMode || loading ? (e) => e.preventDefault() : onDrop}
      >
        {files.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-6">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {isGroupMode ? (
                <UsersIcon className="w-5 h-5 text-sky-300" />
              ) : (
                <UserIcon className="w-5 h-5 text-sky-300" />
              )}
              {isGroupMode ? t('travel.label.group_upload') : t('travel.title')}
            </h3>

            <div className="flex flex-wrap justify-center gap-4">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-600 bg-slate-900"
                >
                  <img src={url} alt={`Person ${idx + 1}`} className="w-full h-full object-cover" />
                  {!isDemoMode && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 w-11 h-11 bg-red-800 text-white rounded-full flex items-center justify-center hover:bg-red-900 cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={t('couple_group.remove_photo')}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-sm text-white text-center font-semibold">
                    #{idx + 1}
                  </div>
                </div>
              ))}

              {!isDemoMode && isGroupMode && files.length < 4 && (
                <button
                  type="button"
                  disabled={loading}
                  data-upload
                  onClick={() => fileInput.current?.click()}
                  className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-sky-500 hover:bg-sky-500/5 transition-colors duration-200 theme-ink-muted hover:text-sky-300"
                >
                  <span className="text-2xl font-light">+</span>
                  <span className="text-sm font-bold tracking-tight text-center px-1">
                    {t('travel.add_person')}
                  </span>
                </button>
              )}
            </div>

            <p className="text-xs theme-ink-muted max-w-sm text-center leading-relaxed">
              {isDemoMode
                ? t('demo.sample_only_hint')
                : isGroupMode
                  ? t('travel.group_upload_tip')
                  : t('travel.upload_hint')}
            </p>

            {error && <ErrorDisplay message={error} />}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isDemoMode && !isGroupMode && (
                <button
                  type="button"
                  disabled={loading}
                  data-upload
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-300 border border-slate-600 rounded-xl cursor-pointer hover:bg-white/5 transition-colors duration-200"
                >
                  {t('travel.change_photo')}
                </button>
              )}

              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={loading || files.length === 0}
                  className={`inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-bold rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isGroupMode
                      ? ' brand-bg brand-bg hover:brand-bg hover:brand-bg focus-visible:brand-ring'
                      : ' brand-bg hover:brand-bg focus-visible:ring-sky-400'
                  }`}
                >
                  <TravelIcon className="w-5 h-5 motion-safe:" />
                  {t('travel.generate_btn')}
                </button>
                <CostEstimateBadge quantity={quantity} imageSize={imageSize} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${
                isGroupMode
                  ? 'brand-bg-tint brand-text-soft brand-border-soft'
                  : 'bg-sky-600/15 text-sky-300 border-sky-500/30'
              }`}
            >
              <TravelIcon className="w-10 h-10" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-100 mb-2">
                {isGroupMode ? t('travel.mode.group') : t('travel.mode.single')}
              </h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mx-auto">
                {t('travel.upload_hint')}
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              data-upload
              onClick={() => fileInput.current?.click()}
              className={`relative inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-bold text-white rounded-2xl cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 ${
                isGroupMode
                  ? 'brand-bg-strong hover:brand-bg focus-visible:brand-ring'
                  : 'bg-sky-700 hover:bg-sky-800 focus-within:ring-sky-400'
              }`}
            >
              {isGroupMode ? <UsersIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
              {t('start.upload_button')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelUploadSection;
