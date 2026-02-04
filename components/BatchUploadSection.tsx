/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Batch upload section component for multiple file uploads.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
  icon = '📸',
  className = '',
}) => {
  const { t } = useLanguage();

  const canAddMore = files.length < maxFiles;
  const canGenerate = files.length >= minFiles && files.length <= maxFiles && !loading;

  return (
    <div className={`flex flex-col gap-4 w-full max-w-4xl mx-auto ${className}`}>
      <div
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 ${
          isDraggingOver
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
            : files.length > 0
              ? 'border-gray-700 bg-gray-800/20'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/10'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {files.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {icon} {t('batch.uploaded_files', { count: files.length, max: maxFiles })}
            </h3>

            {/* File Previews Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900 shadow-xl transition-transform hover:scale-105"
                >
                  <img
                    src={url}
                    alt={`File ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label={t('batch.remove_file')}
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-1 text-xs text-white text-center font-bold">
                    #{idx + 1}
                  </div>
                </div>
              ))}

              {canAddMore && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all text-gray-500 hover:text-blue-400 group">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={onFileChange}
                  />
                  <span className="text-3xl group-hover:scale-125 transition-transform">+</span>
                  <span className="text-xs uppercase font-bold tracking-tighter">
                    {t('batch.add_more')}
                  </span>
                </label>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm animate-pulse font-medium">⚠️ {error}</p>
            )}

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-gray-300 border border-gray-600 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                  aria-label={t('batch.change_files')}
                />
                {t('batch.change_files')}
              </label>

              <button
                onClick={onGenerate}
                disabled={!canGenerate}
                className={`inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-black rounded-xl shadow-xl transition-all duration-300 transform active:scale-95 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-600/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t('batch.generating')}
                  </>
                ) : (
                  <>
                    <span>{icon}</span>
                    {t('batch.generate_all').replace('{count}', String(files.length))}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 italic max-w-sm text-center">
              {t('batch.hint').replace('{min}', String(minFiles)).replace('{max}', String(maxFiles))}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <span className="text-4xl">{icon}</span>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">
                {t('batch.title')}
              </h3>
              <p className="text-sm text-gray-400 max-w-xs">
                {t('batch.upload_hint').replace('{min}', String(minFiles)).replace('{max}', String(maxFiles))}
              </p>
            </div>

            <label
              htmlFor="batch-image-upload"
              className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-black text-white rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl hover:-translate-y-1 active:scale-95 bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
            >
              <span className="mr-3">{icon}</span>
              {t('batch.upload_button')}
            </label>
            <input
              id="batch-image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={onFileChange}
              aria-label={t('batch.upload_button')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchUploadSection;
