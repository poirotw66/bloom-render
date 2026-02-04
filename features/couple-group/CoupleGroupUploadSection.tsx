/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Upload section for couple/group photos with multi-file support.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { CoupleGroupMode } from './types';

interface CoupleGroupUploadSectionProps {
  mode: CoupleGroupMode;
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
}

const CoupleGroupUploadSection: React.FC<CoupleGroupUploadSectionProps> = ({
  mode,
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
}) => {
  const { t } = useLanguage();

  const maxFiles = mode === 'couple' ? 2 : 6;
  const minFiles = mode === 'couple' ? 2 : 3;
  const canAddMore = mode === 'couple' ? files.length < 2 : files.length < 6;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      <div
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 ${
          isDraggingOver
            ? 'border-pink-400 bg-pink-500/10 scale-[1.02]'
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
              {mode === 'couple' ? '💑' : '👨‍👩‍👧‍👦'} {t(`couple_group.mode.${mode}`)}
            </h3>

            <div className="flex flex-wrap justify-center gap-4">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900 shadow-xl transition-transform hover:scale-105"
                >
                  <img
                    src={url}
                    alt={`Person ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label={t('couple_group.remove_photo')}
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-0.5 text-[8px] text-white text-center font-bold">
                    #{idx + 1}
                  </div>
                </div>
              ))}

              {canAddMore && (
                <label className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-all text-gray-500 hover:text-pink-400 group">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={onFileChange}
                  />
                  <span className="text-2xl group-hover:scale-125 transition-transform">+</span>
                  <span className="text-[10px] uppercase font-bold tracking-tighter">
                    {t('couple_group.add_photo')}
                  </span>
                </label>
              )}
            </div>

            <p className="text-xs text-gray-500 italic max-w-sm text-center">
              {mode === 'couple'
                ? t('couple_group.hint_couple')
                : t('couple_group.hint_group')}
            </p>

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
                  aria-label={t('couple_group.change_photo')}
                />
                {t('couple_group.change_photo')}
              </label>

              <button
                onClick={onGenerate}
                disabled={
                  loading ||
                  (mode === 'couple' && files.length !== 2) ||
                  (mode === 'group' && (files.length < minFiles || files.length > maxFiles))
                }
                className={`inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-black rounded-xl shadow-xl transition-all duration-300 transform active:scale-95 ${
                  mode === 'couple'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-pink-600/20'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20'
                } disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t('couple_group.generating')}
                  </>
                ) : (
                  <>
                    <span>{mode === 'couple' ? '💑' : '👨‍👩‍👧‍👦'}</span>
                    {t('couple_group.generate_btn')}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                mode === 'couple'
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                  : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              }`}
            >
              <span className="text-4xl">{mode === 'couple' ? '💑' : '👨‍👩‍👧‍👦'}</span>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">
                {t(`couple_group.mode.${mode}`)}
              </h3>
              <p className="text-sm text-gray-400 max-w-xs">
                {mode === 'couple'
                  ? t('couple_group.upload_hint_couple')
                  : t('couple_group.upload_hint_group')}
              </p>
            </div>

            <label
              htmlFor="image-upload-couple-group"
              className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-black text-white rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl hover:-translate-y-1 active:scale-95 ${
                mode === 'couple'
                  ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
              }`}
            >
              <span className="mr-3">{mode === 'couple' ? '💑' : '👨‍👩‍👧‍👦'}</span>
              {t('start.upload_button')}
            </label>
            <input
              id="image-upload-couple-group"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={onFileChange}
              aria-label={t('start.upload_button')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CoupleGroupUploadSection;
