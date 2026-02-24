/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared single-image upload panel for portrait/themed/id-photo flows.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { IdPhotoIcon } from './icons';
import { ErrorDisplay } from './ErrorDisplay';

type Accent = 'blue' | 'purple' | 'emerald';

interface SingleImageUploadPanelProps {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  loading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  titleKey: string;
  generateButtonKey: string;
  uploadInputId: string;
  accent: Accent;
}

const accentClasses: Record<
  Accent,
  {
    drag: string;
    button: string;
    buttonHover: string;
    buttonShadow: string;
    focusRing: string;
    uploadButton: string;
    uploadButtonHover: string;
    uploadButtonShadow: string;
    uploadFocusRing: string;
  }
> = {
  blue: {
    drag: 'border-blue-400 bg-blue-500/10',
    button: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-500',
    buttonShadow: 'shadow-blue-500/20',
    focusRing: 'focus:ring-blue-500',
    uploadButton: 'bg-blue-600',
    uploadButtonHover: 'hover:bg-blue-500',
    uploadButtonShadow: 'shadow-blue-600/20',
    uploadFocusRing: 'focus-within:ring-blue-500',
  },
  purple: {
    drag: 'border-purple-400 bg-purple-500/10',
    button: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-500',
    buttonShadow: 'shadow-purple-500/20',
    focusRing: 'focus:ring-purple-500',
    uploadButton: 'bg-purple-600',
    uploadButtonHover: 'hover:bg-purple-500',
    uploadButtonShadow: 'shadow-purple-600/20',
    uploadFocusRing: 'focus-within:ring-purple-500',
  },
  emerald: {
    drag: 'border-emerald-400 bg-emerald-500/10',
    button: 'bg-emerald-600',
    buttonHover: 'hover:bg-emerald-500',
    buttonShadow: 'shadow-emerald-500/20',
    focusRing: 'focus:ring-emerald-500',
    uploadButton: 'bg-emerald-600',
    uploadButtonHover: 'hover:bg-emerald-500',
    uploadButtonShadow: 'shadow-emerald-600/20',
    uploadFocusRing: 'focus-within:ring-emerald-500',
  },
};

export function SingleImageUploadPanel({
  file,
  previewUrl,
  error,
  loading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
  titleKey,
  generateButtonKey,
  uploadInputId,
  accent,
}: SingleImageUploadPanelProps): React.ReactElement {
  const { t } = useLanguage();
  const c = accentClasses[accent];

  if (file) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white">{t(titleKey)}</h3>
        <div className="w-40 h-40 rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex items-center justify-center">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          )}
        </div>
        <p className="text-sm text-gray-400">{t('start.idphoto_upload_hint')}</p>
        {error && <ErrorDisplay message={error} />}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onFileChange}
              aria-label={t('start.idphoto_change_photo')}
            />
            {t('start.idphoto_change_photo')}
          </label>
          <button
            onClick={onGenerate}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-lg shadow-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${c.button} ${c.buttonHover} ${c.buttonShadow} ${c.focusRing}`}
          >
            <IdPhotoIcon className="w-5 h-5" />
            {t(generateButtonKey)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-12 border-2 border-dashed rounded-xl bg-gray-800/20 w-full max-w-2xl flex flex-col items-center justify-center gap-4 transition-colors duration-200 ${
        isDraggingOver ? c.drag : 'border-gray-700 hover:border-gray-500'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label
        htmlFor={uploadInputId}
        className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white rounded-full cursor-pointer group transition-colors duration-200 shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 ${c.uploadButton} ${c.uploadButtonHover} ${c.uploadButtonShadow} ${c.uploadFocusRing}`}
      >
        <IdPhotoIcon className="w-6 h-6 mr-3" />
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
      <p className="text-sm text-gray-400">{t('start.idphoto_upload_hint')}</p>
    </div>
  );
}
