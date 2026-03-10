/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TravelIcon } from '../../components/icons';
import { ErrorDisplay } from '../../components/ErrorDisplay';

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
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-2">
        <div className="flex bg-gray-900/60 p-1 rounded-full border border-gray-700/50 backdrop-blur-md shadow-inner">
          <button
            onClick={() => {
              setIsGroupMode(false);
              // If we have more than 1 file, keep only the first one when switching to single
              if (files.length > 1) {
                // This logic is handled in handleFileChange, but for UI immediate feedback:
              }
            }}
            className={`px-6 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
              !isGroupMode
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            👤 {t('travel.mode.single')}
          </button>
          <button
            onClick={() => setIsGroupMode(true)}
            className={`px-6 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
              isGroupMode
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            👥 {t('travel.mode.group')}
          </button>
        </div>
      </div>

      <div
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 ${
          isDraggingOver
            ? 'border-amber-400 bg-amber-500/10 scale-[1.02]'
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
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {isGroupMode ? '👥 ' + t('travel.label.group_upload') : '👤 ' + t('travel.title')}
            </h3>

            <div className="flex flex-wrap justify-center gap-4">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900 shadow-xl transition-transform hover:scale-105"
                >
                  <img src={url} alt={`Person ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-0.5 text-[8px] text-white text-center font-bold">
                    #{idx + 1}
                  </div>
                </div>
              ))}

              {isGroupMode && files.length < 4 && (
                <label className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-gray-500 hover:text-indigo-400 group">
                  <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                  <span className="text-2xl group-hover:scale-125 transition-transform">+</span>
                  <span className="text-[10px] uppercase font-bold tracking-tighter">
                    Add Person
                  </span>
                </label>
              )}
            </div>

            <p className="text-xs text-gray-500 italic max-w-sm text-center">
              {isGroupMode
                ? 'Tip: Clear face photos work best for group AI generation.'
                : t('travel.upload_hint')}
            </p>

            {error && <ErrorDisplay message={error} />}

            <div className="flex items-center gap-4">
              {!isGroupMode && (
                <label className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-gray-300 border border-gray-600 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                    aria-label={t('travel.change_photo')}
                  />
                  {t('travel.change_photo')}
                </label>
              )}

              <button
                onClick={onGenerate}
                disabled={loading || files.length === 0}
                className={`inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-black rounded-xl shadow-xl transition-all duration-300 transform active:scale-95 ${
                  isGroupMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/20'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20'
                } disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
              >
                <TravelIcon className="w-5 h-5 animate-bounce" />
                {t('travel.generate_btn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${isGroupMode ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'}`}
            >
              <TravelIcon className="w-10 h-10" />
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">
                {isGroupMode ? t('travel.mode.group') : t('travel.mode.single')}
              </h3>
              <p className="text-base text-gray-400 max-w-xs leading-relaxed">
                {t('travel.upload_hint')}
              </p>
            </div>

            <label
              htmlFor="image-upload-travel"
              className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-black text-white rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl hover:-translate-y-1 active:scale-95 ${
                isGroupMode
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              }`}
            >
              <span className="mr-3">{isGroupMode ? '👥' : '👤'}</span>
              {t('start.upload_button')}
            </label>
            <input
              id="image-upload-travel"
              type="file"
              className="hidden"
              accept="image/*"
              multiple={isGroupMode}
              onChange={onFileChange}
              aria-label={t('start.upload_button')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelUploadSection;
