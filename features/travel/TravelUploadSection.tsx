/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
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

  const modeActive = 'bg-sky-600 text-white shadow-md shadow-sky-600/25';
  const modeIdle = 'text-slate-500 hover:text-slate-300';

  return (
    <div className={`flex flex-col gap-4 w-full max-w-2xl mx-auto p-4 ${TRAVEL_PANEL}`}>
      <div className="flex justify-center">
        <div
          className="inline-flex p-1 rounded-full border border-slate-700/60 bg-slate-950/80 shadow-inner"
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
        className={`relative p-8 border-2 border-dashed rounded-2xl transition-colors duration-200 flex flex-col items-center justify-center gap-6 ${
          isDraggingOver
            ? 'border-sky-400 bg-sky-500/10'
            : files.length > 0
              ? 'border-slate-600 bg-slate-800/30'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/20'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
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
                  className="group relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-600 bg-slate-900 shadow-lg"
                >
                  <img src={url} alt={`Person ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-7 h-7 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 cursor-pointer focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label={t('travel.change_photo')}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-0.5 text-[10px] text-white text-center font-semibold">
                    #{idx + 1}
                  </div>
                </div>
              ))}

              {isGroupMode && files.length < 4 && (
                <label className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-sky-500 hover:bg-sky-500/5 transition-colors duration-200 text-slate-500 hover:text-sky-300">
                  <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                  <span className="text-2xl font-light">+</span>
                  <span className="text-[10px] uppercase font-bold tracking-tight text-center px-1">
                    {t('travel.add_person')}
                  </span>
                </label>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
              {isGroupMode ? t('travel.group_upload_tip') : t('travel.upload_hint')}
            </p>

            {error && <ErrorDisplay message={error} />}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isGroupMode && (
                <label className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-300 border border-slate-600 rounded-xl cursor-pointer hover:bg-white/5 transition-colors duration-200">
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
                type="button"
                onClick={onGenerate}
                disabled={loading || files.length === 0}
                className={`inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-bold rounded-xl shadow-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isGroupMode
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/20 focus:ring-indigo-400'
                    : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-sky-600/20 focus:ring-sky-400'
                }`}
              >
                <TravelIcon className="w-5 h-5 motion-safe:animate-pulse" />
                {t('travel.generate_btn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner border ${
                isGroupMode
                  ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30'
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

            <label
              htmlFor="image-upload-travel"
              className={`relative inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-bold text-white rounded-2xl cursor-pointer transition-colors duration-200 shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 ${
                isGroupMode
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 focus-within:ring-indigo-400'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/25 focus-within:ring-sky-400'
              }`}
            >
              {isGroupMode ? <UsersIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
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
