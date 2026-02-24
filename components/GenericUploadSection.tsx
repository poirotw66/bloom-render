/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic upload section component for generate pages.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ErrorDisplay } from './ErrorDisplay';

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
}) => {
  const { t } = useLanguage();

  return (
    <div className={`flex flex-col gap-4 w-full max-w-2xl mx-auto ${className}`}>
      <div
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 ${
          isDraggingOver
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
            : previewUrl
              ? 'border-gray-700 bg-gray-800/20'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/10'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="relative w-full max-w-md">
              <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-xl shadow-xl" />
            </div>

            {error && <ErrorDisplay message={error} />}

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-gray-300 border border-gray-600 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                  aria-label={t(changePhotoKey)}
                />
                {t(changePhotoKey)}
              </label>

              <button
                onClick={onGenerate}
                disabled={loading || !canGenerate}
                className="inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-black rounded-xl shadow-xl transition-all duration-300 transform active:scale-95 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-600/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <span className="text-4xl">{icon}</span>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 max-w-xs">{t(uploadHintKey)}</p>
            </div>

            <label
              htmlFor={uploadInputId}
              className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-black text-white rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl hover:-translate-y-1 active:scale-95 bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
            >
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
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericUploadSection;
