/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Upload section for AI try-on: one person photo + multiple clothing photos.
 */

import React, { useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { usePasteImage } from '../../hooks/usePasteImage';
import CostEstimateBadge from '../../components/CostEstimateBadge';
import QuantitySelector from '../../components/QuantitySelector';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { UserIcon, XMarkIcon } from '../../components/icons';

interface TryOnUploadSectionProps {
  personPreviewUrl: string | null;
  clothingPreviewUrls: string[];
  error: string | null;
  loading: boolean;
  disabled?: boolean;
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
  children?: React.ReactNode;
}

const TryOnUploadSection: React.FC<TryOnUploadSectionProps> = ({
  personPreviewUrl,
  clothingPreviewUrls,
  error,
  loading,
  disabled = false,
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
  children,
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const isDisabled = loading || disabled;
  const hasPerson = personPreviewUrl !== null;
  const clothingCount = clothingPreviewUrls.length;
  const canAddClothing = !isDemoMode && !isDisabled && clothingCount < maxClothing;
  const personZoneRef = useRef<HTMLDivElement>(null);
  const clothingZoneRef = useRef<HTMLDivElement>(null);

  const emitPerson = useCallback(
    (file: File) => {
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: dt.files });
      onPersonFileChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [onPersonFileChange],
  );
  const emitClothing = useCallback(
    (file: File) => {
      if (!canAddClothing) return;
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: dt.files });
      onClothingFileChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [canAddClothing, onClothingFileChange],
  );
  usePasteImage(personZoneRef, emitPerson, { enabled: !isDemoMode && !isDisabled });
  usePasteImage(clothingZoneRef, emitClothing, { enabled: !isDemoMode && canAddClothing });

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {isDemoMode && (
        <p className="text-xs text-sky-200/80 text-center">{t('demo.sample_only_hint')}</p>
      )}
      {/* Person photo */}
      <div
        ref={personZoneRef}
        tabIndex={isDemoMode ? undefined : 0}
        role="group"
        aria-label={t('tryon.person_photo')}
        className={`relative rounded-3xl border-2 border-dashed p-6 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
          isDraggingOver && !isDemoMode
            ? 'border-teal-400 bg-teal-500/10'
            : 'border-gray-700/50 bg-gray-800/40'
        } ${hasPerson ? 'border-teal-500/30' : ''}`}
        onDragOver={isDemoMode ? (e) => e.preventDefault() : onDragOver}
        onDragLeave={isDemoMode ? undefined : onDragLeave}
        onDrop={isDemoMode || isDisabled ? (e) => e.preventDefault() : onDropPerson}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">
            1
          </span>
          <h3 className="text-xs font-bold text-gray-400 tracking-normal">
            {t('tryon.person_photo')}
          </h3>
        </div>
        {personPreviewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative group w-48 h-64 rounded-2xl overflow-hidden border-2 border-teal-500/30 bg-gray-900">
              <img
                src={personPreviewUrl}
                alt="Person"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {!isDemoMode && (
                <>
                  <div className="absolute inset-0 from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-sm text-white font-medium bg-teal-600/80 px-2 py-1 rounded-full">
                      {t('tryon.change_person')}
                    </span>
                  </div>
                  <input
                    type="file"
                    data-testid="tryon-person-input"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    aria-label={t('tryon.change_person')}
                    disabled={isDisabled}
                    onChange={onPersonFileChange}
                  />
                </>
              )}
              {isDemoMode && (
                <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-sky-500/90 px-2 py-0.5 text-[11px] font-bold tracking-normal text-white">
                  {t('demo.sample_input')}
                </span>
              )}
            </div>
            <p className="text-sm text-teal-500/80 font-medium">{t('common.selected')}</p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/40 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-gray-400">
              <UserIcon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold text-gray-300 group-hover:text-teal-400 transition-colors">
                {t('tryon.upload_person_hint')}
              </span>
              <span className="text-sm text-gray-500 mt-1 tracking-normal">
                {t('start.upload_drag')}
              </span>
            </div>
            <input
              type="file"
              data-testid="tryon-person-input"
              className="hidden"
              accept="image/*"
              aria-label={t('tryon.person_photo')}
              disabled={isDisabled || isDemoMode}
              onChange={onPersonFileChange}
            />
          </label>
        )}
      </div>

      {/* Visual Connector */}
      <div className="flex justify-center -my-3 z-10">
        <div className="bg-gray-900 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
          <span className="text-xs text-gray-500 font-bold tracking-normal self-center">+</span>
        </div>
      </div>

      {/* Clothing photos */}
      <div
        ref={clothingZoneRef}
        tabIndex={isDemoMode ? undefined : 0}
        role="group"
        aria-label={t('tryon.clothing_photos')}
        className={`relative rounded-3xl border-2 border-dashed p-6 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          isDraggingOver && !isDemoMode
            ? 'border-amber-400/60 bg-amber-500/10'
            : 'border-gray-700/50 bg-gray-800/40'
        } ${clothingCount > 0 ? 'border-amber-500/30' : ''}`}
        onDragOver={isDemoMode ? (e) => e.preventDefault() : onDragOver}
        onDragLeave={isDemoMode ? undefined : onDragLeave}
        onDrop={isDemoMode || isDisabled ? (e) => e.preventDefault() : onDropClothing}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              2
            </span>
            <h3 className="text-xs font-bold text-gray-400 tracking-normal">
              {t('tryon.clothing_photos')}
            </h3>
          </div>
          <span
            className={`text-sm font-bold px-2 py-0.5 rounded-full ${clothingCount >= minClothing ? 'text-amber-400 bg-amber-500/10' : 'text-gray-500 bg-gray-800'}`}
          >
            {clothingCount} / {maxClothing}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {clothingPreviewUrls.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-800 bg-gray-900"
            >
              <img
                src={url}
                alt={`Clothing ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {!isDemoMode && (
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onRemoveClothing(idx)}
                  className="absolute top-1 right-1 min-w-11 min-h-11 bg-gray-950/85 text-white rounded-full flex items-center justify-center transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300 disabled:opacity-50"
                  aria-label={t('tryon.remove_clothing')}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded-md text-[8px] text-white/80 font-bold">
                #{idx + 1}
              </div>
            </div>
          ))}
          {canAddClothing && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors text-gray-500 hover:text-amber-400 group">
              <input
                type="file"
                data-testid="tryon-clothing-input"
                className="hidden"
                accept="image/*"
                multiple
                aria-label={t('tryon.add_clothing')}
                disabled={isDisabled}
                onChange={onClothingFileChange}
              />
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                +
              </span>
              <span className="text-[8px] font-black tracking-normal opacity-70">
                {t('tryon.add_clothing')}
              </span>
            </label>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-4 italic text-center leading-tight">
          {t('tryon.clothing_hint')}
        </p>
      </div>

      {children}

      <div className="w-full max-w-md mx-auto">
        <QuantitySelector
          quantity={quantity}
          onChange={onQuantityChange}
          disabled={isDisabled}
          min={1}
          max={4}
        />
        <p className="text-xs text-gray-500 mt-1 text-center">{t('tryon.quantity_hint')}</p>
      </div>

      {error && <ErrorDisplay message={error} />}

      <div className="flex flex-col items-center gap-1.5 w-full">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isDisabled || !canGenerate}
          className="w-full py-4 px-6 brand-bg hover:brand-bg disabled:brand-bg text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              {t('tryon.generating')}
            </>
          ) : (
            t('tryon.generate_btn')
          )}
        </button>
        <CostEstimateBadge quantity={quantity} />
      </div>
    </div>
  );
};

export default TryOnUploadSection;
