/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Upload section for AI try-on: one person photo + multiple clothing photos.
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import QuantitySelector from '../../components/QuantitySelector';
import { ErrorDisplay } from '../../components/ErrorDisplay';

interface TryOnUploadSectionProps {
  personPreviewUrl: string | null;
  clothingPreviewUrls: string[];
  error: string | null;
  loading: boolean;
  isDraggingOver: boolean;
  canGenerate: boolean;
  minClothing: number;
  maxClothing: number;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onPersonFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClothingFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveClothing: (index: number) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDropPerson: (e: React.DragEvent) => void;
  onDropClothing: (e: React.DragEvent) => void;
}

const TryOnUploadSection: React.FC<TryOnUploadSectionProps> = ({
  personPreviewUrl,
  clothingPreviewUrls,
  error,
  loading,
  isDraggingOver,
  canGenerate,
  minClothing,
  maxClothing,
  quantity,
  onQuantityChange,
  onPersonFileChange,
  onClothingFileChange,
  onRemoveClothing,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDropPerson,
  onDropClothing,
}) => {
  const { t } = useLanguage();
  const hasPerson = personPreviewUrl !== null;
  const clothingCount = clothingPreviewUrls.length;
  const canAddClothing = clothingCount < maxClothing;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* Person photo */}
      <div
        className={`relative rounded-3xl border-2 border-dashed p-6 transition-all duration-500 ${isDraggingOver ? 'border-teal-400 bg-teal-500/10' : 'border-gray-700/50 bg-gray-800/40'
          } ${hasPerson ? 'border-teal-500/30' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDropPerson}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">1</span>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {t('tryon.person_photo')}
          </h3>
        </div>
        {personPreviewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative group w-48 h-64 rounded-2xl overflow-hidden border-2 border-teal-500/30 bg-gray-900 shadow-2xl">
              <img
                src={personPreviewUrl}
                alt="Person"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                <span className="text-[10px] text-white font-medium bg-teal-600/80 px-2 py-1 rounded-full">{t('tryon.change_person')}</span>
              </div>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={onPersonFileChange}
              />
            </div>
            <p className="text-[10px] text-teal-500/80 font-medium">✨ {t('common.selected')}</p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/40 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">👤</div>
            <div className="text-center">
              <span className="block text-sm font-bold text-gray-300 group-hover:text-teal-400 transition-colors">{t('tryon.upload_person_hint')}</span>
              <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">{t('start.upload_drag')}</span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onPersonFileChange}
            />
          </label>
        )}
      </div>

      {/* Visual Connector */}
      <div className="flex justify-center -my-3 z-10">
        <div className="bg-gray-900 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter self-center">+</span>
        </div>
      </div>

      {/* Clothing photos */}
      <div
        className={`relative rounded-3xl border-2 border-dashed p-6 transition-all duration-500 ${isDraggingOver ? 'border-amber-400/60 bg-amber-500/10' : 'border-gray-700/50 bg-gray-800/40'
          } ${clothingCount > 0 ? 'border-amber-500/30' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDropClothing}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">2</span>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t('tryon.clothing_photos')}
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${clothingCount >= minClothing ? 'text-amber-400 bg-amber-500/10' : 'text-gray-500 bg-gray-800'}`}>
            {clothingCount} / {maxClothing}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {clothingPreviewUrls.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-800 bg-gray-900 shadow-lg"
            >
              <img src={url} alt={`Clothing ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <button
                type="button"
                onClick={() => onRemoveClothing(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 scale-75 group-hover:scale-100"
                aria-label={t('tryon.remove_clothing')}
              >
                ✕
              </button>
              <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded-md text-[8px] text-white/80 font-bold">
                #{idx + 1}
              </div>
            </div>
          ))}
          {canAddClothing && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-gray-500 hover:text-amber-400 group">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={onClothingFileChange}
              />
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">+</span>
              <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">{t('tryon.add_clothing')}</span>
            </label>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mt-4 italic text-center leading-tight">
          💡 {t('tryon.clothing_hint')}
        </p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <QuantitySelector
          quantity={quantity}
          onChange={onQuantityChange}
          disabled={loading}
          min={1}
          max={4}
        />
        <p className="text-xs text-gray-500 mt-1 text-center">
          {t('tryon.quantity_hint')}
        </p>
      </div>

      {error && <ErrorDisplay message={error} />}

      <button
        type="button"
        onClick={onGenerate}
        disabled={loading || !canGenerate}
        className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            {t('tryon.generating')}
          </>
        ) : (
          <>
            <span>👗</span>
            {t('tryon.generate_btn')}
          </>
        )}
      </button>
    </div>
  );
};

export default TryOnUploadSection;
