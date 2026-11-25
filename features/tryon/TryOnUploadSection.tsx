import React, { useCallback, useId, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { usePasteImage } from '../../hooks/usePasteImage';
import CostEstimateBadge from '../../components/CostEstimateBadge';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { XMarkIcon } from '../../components/icons';

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

export default function TryOnUploadSection({
  personPreviewUrl,
  clothingPreviewUrls,
  error,
  loading,
  disabled = false,
  isDraggingOver,
  canGenerate,
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
}: TryOnUploadSectionProps) {
  const { t, language } = useLanguage();
  const { isDemoMode } = useSettings();
  const zh = language === 'zh-TW';
  const isDisabled = loading || disabled;
  const canAddClothing = !isDemoMode && !isDisabled && clothingPreviewUrls.length < maxClothing;
  const personZoneRef = useRef<HTMLDivElement>(null);
  const clothingZoneRef = useRef<HTMLDivElement>(null);
  const personInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const clothingHintId = useId();
  const emitFile = useCallback(
    (file: File, onChange: TryOnUploadSectionProps['onPersonFileChange']) => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      onChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [],
  );
  const emitPerson = useCallback(
    (file: File) => emitFile(file, onPersonFileChange),
    [emitFile, onPersonFileChange],
  );
  const emitClothing = useCallback(
    (file: File) => {
      if (canAddClothing) emitFile(file, onClothingFileChange);
    },
    [canAddClothing, emitFile, onClothingFileChange],
  );
  usePasteImage(personZoneRef, emitPerson, { enabled: !isDemoMode && !isDisabled });
  usePasteImage(clothingZoneRef, emitClothing, { enabled: canAddClothing });

  return (
    <div className="tryon-input-form">
      {isDemoMode && <p className="tryon-hint">{t('demo.sample_only_hint')}</p>}
      <div className="tryon-upload-grid">
        <div
          ref={personZoneRef}
          role="group"
          aria-label={t('tryon.person_photo')}
          className={`tryon-upload ${isDraggingOver ? 'is-dragging' : ''}`}
          onDragOver={isDemoMode ? (event) => event.preventDefault() : onDragOver}
          onDragLeave={isDemoMode ? undefined : onDragLeave}
          onDrop={isDemoMode || isDisabled ? (event) => event.preventDefault() : onDropPerson}
        >
          <div className="tryon-upload-heading">
            <span>{t('tryon.person_photo')}</span>
            {isDemoMode && <span className="tryon-badge">{t('demo.sample_input')}</span>}
          </div>
          {personPreviewUrl && (
            <div className="tryon-person-preview">
              <img src={personPreviewUrl} alt="Person" width="300" height="360" />
            </div>
          )}
          {!isDemoMode && (
            <input
              ref={personInputRef}
              type="file"
              className="tryon-person-input"
              data-testid="tryon-person-input"
              accept="image/*"
              aria-label={personPreviewUrl ? t('tryon.change_person') : t('tryon.person_photo')}
              disabled={isDisabled}
              onChange={onPersonFileChange}
            />
          )}
        </div>
        <div
          ref={clothingZoneRef}
          role="group"
          aria-label={t('tryon.clothing_photos')}
          aria-describedby={clothingHintId}
          className={`tryon-upload ${isDraggingOver ? 'is-dragging' : ''}`}
          onDragOver={isDemoMode ? (event) => event.preventDefault() : onDragOver}
          onDragLeave={isDemoMode ? undefined : onDragLeave}
          onDrop={isDemoMode || isDisabled ? (event) => event.preventDefault() : onDropClothing}
        >
          <div className="tryon-upload-heading">
            <span>{t('tryon.clothing_photos')}</span>
            <span className="tryon-count">
              {clothingPreviewUrls.length} / {maxClothing}
            </span>
          </div>
          <div className="tryon-clothing-grid">
            {clothingPreviewUrls.map((url, index) => (
              <div key={url} className="tryon-clothing-thumb">
                <img src={url} alt={`Clothing ${index + 1}`} width="140" height="180" />
                {!isDemoMode && (
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onRemoveClothing(index)}
                    className="tryon-remove"
                    aria-label={t('tryon.remove_clothing')}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {canAddClothing && (
              <>
                <button
                  type="button"
                  className="tryon-add-clothing"
                  aria-label={t('tryon.add_clothing')}
                  aria-describedby={clothingHintId}
                  onClick={() => clothingInputRef.current?.click()}
                >
                  <span aria-hidden="true">＋</span>
                  <span>{t('tryon.add_clothing')}</span>
                </button>
                <input
                  ref={clothingInputRef}
                  type="file"
                  data-testid="tryon-clothing-input"
                  accept="image/*"
                  multiple
                  aria-label={t('tryon.add_clothing')}
                  aria-describedby={clothingHintId}
                  disabled={isDisabled}
                  onChange={onClothingFileChange}
                  hidden
                />
              </>
            )}
          </div>
        </div>
      </div>
      <p id={clothingHintId} className="tryon-hint">
        {zh
          ? '上傳商品圖，或從上方參考素材庫選擇。'
          : 'Upload product photos or choose from the reference library.'}
      </p>
      {children}
      <div className="tryon-generate-row">
        <label className="tryon-field tryon-quantity">
          <span>{zh ? '張數' : 'Images'}</span>
          <select
            value={quantity}
            onChange={(event) => onQuantityChange(Number(event.target.value))}
            disabled={isDisabled}
            className="tool-control"
          >
            {[1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isDisabled || !canGenerate}
          className="tool-button tool-button-primary tryon-generate"
        >
          {loading ? t('tryon.generating') : t('tryon.generate_btn')}
        </button>
      </div>
      <CostEstimateBadge quantity={quantity} />
      {error && <ErrorDisplay message={error} />}
    </div>
  );
}
