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
  onChooseClothing?: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDropPerson: (e: React.DragEvent) => void;
  onDropClothing: (e: React.DragEvent) => void;
  poseControls?: React.ReactNode;
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
  onChooseClothing,
  onDragOver,
  onDragLeave,
  onDropPerson,
  onDropClothing,
  poseControls,
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
          className={`tryon-upload tryon-workflow-step ${isDraggingOver ? 'is-dragging' : ''}`}
          onDragOver={isDemoMode ? (event) => event.preventDefault() : onDragOver}
          onDragLeave={isDemoMode ? undefined : onDragLeave}
          onDrop={isDemoMode || isDisabled ? (event) => event.preventDefault() : onDropPerson}
        >
          <div className="tryon-step-heading">
            <h3>
              <span className="tryon-step-number">01</span>
              {zh ? '人物照片' : 'Person photo'}
            </h3>
            {personPreviewUrl && (
              <span className="tryon-step-state">{zh ? '已加入' : 'Added'}</span>
            )}
          </div>
          {isDemoMode ? (
            <div className="tryon-person-preview">
              {personPreviewUrl && (
                <img
                  src={personPreviewUrl}
                  alt={zh ? '人物照片' : 'Person photo'}
                  width="300"
                  height="360"
                />
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`tryon-person-drop ${personPreviewUrl ? 'has-photo' : ''}`}
                disabled={isDisabled}
                onClick={() => personInputRef.current?.click()}
                aria-label={personPreviewUrl ? t('tryon.change_person') : t('tryon.person_photo')}
              >
                {personPreviewUrl ? (
                  <img
                    src={personPreviewUrl}
                    alt={zh ? '人物照片' : 'Person photo'}
                    width="300"
                    height="360"
                  />
                ) : (
                  <>
                    <span className="tryon-drop-mark" aria-hidden="true">
                      ＋
                    </span>
                    <span>{zh ? '上傳人物照片' : 'Upload person photo'}</span>
                    <small>{zh ? '也可拖放或貼上圖片' : 'Or drop or paste an image'}</small>
                  </>
                )}
                {personPreviewUrl && (
                  <span className="tryon-image-label">{t('tryon.change_person')}</span>
                )}
              </button>
              <input
                ref={personInputRef}
                type="file"
                className="tryon-person-input"
                data-testid="tryon-person-input"
                accept="image/*"
                aria-label={personPreviewUrl ? t('tryon.change_person') : t('tryon.person_photo')}
                disabled={isDisabled}
                onChange={onPersonFileChange}
                hidden
              />
            </>
          )}
        </div>
        <div
          ref={clothingZoneRef}
          role="group"
          aria-label={t('tryon.clothing_photos')}
          aria-describedby={clothingHintId}
          className={`tryon-upload tryon-workflow-step ${isDraggingOver ? 'is-dragging' : ''}`}
          onDragOver={isDemoMode ? (event) => event.preventDefault() : onDragOver}
          onDragLeave={isDemoMode ? undefined : onDragLeave}
          onDrop={isDemoMode || isDisabled ? (event) => event.preventDefault() : onDropClothing}
        >
          <div className="tryon-step-heading">
            <h3>
              <span className="tryon-step-number">02</span>
              {zh ? '服裝搭配' : 'Clothing'}
            </h3>
            <span className="tryon-count">
              {clothingPreviewUrls.length} / {maxClothing}
            </span>
          </div>
          {clothingPreviewUrls.length > 0 && (
            <div className="tryon-clothing-grid">
              {clothingPreviewUrls.map((url, index) => (
                <div key={url} className="tryon-clothing-thumb">
                  <img
                    src={url}
                    alt={`${zh ? '服裝' : 'Clothing'} ${index + 1}`}
                    width="140"
                    height="180"
                  />
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
            </div>
          )}
          {!isDemoMode && (
            <div className="tryon-role-actions">
              <button
                type="button"
                className="tool-button tool-button-secondary"
                disabled={!canAddClothing}
                onClick={() => clothingInputRef.current?.click()}
              >
                {t('tryon.add_clothing')}
              </button>
              {onChooseClothing && (
                <button
                  type="button"
                  className="tool-button tool-button-secondary"
                  disabled={!canAddClothing}
                  onClick={onChooseClothing}
                >
                  {zh ? '挑選服裝' : 'Choose clothing'}
                </button>
              )}
            </div>
          )}
          <input
            ref={clothingInputRef}
            type="file"
            data-testid="tryon-clothing-input"
            accept="image/*"
            multiple
            aria-label={t('tryon.add_clothing')}
            aria-describedby={clothingHintId}
            disabled={!canAddClothing}
            onChange={onClothingFileChange}
            hidden
          />
          <p id={clothingHintId} className="tryon-hint">
            {zh
              ? '加入商品圖，可將多件服裝組合成一套。'
              : 'Add product photos to combine garments into one outfit.'}
          </p>
        </div>
      </div>
      {poseControls}
      {children && (
        <details className="tryon-disclosure tryon-advanced">
          <summary>{zh ? '進階設定與其他參考' : 'Advanced settings and references'}</summary>
          <div className="tryon-advanced-content">{children}</div>
        </details>
      )}
      <div className="tryon-generation-controls">
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
            disabled={isDisabled}
            className="tool-button tool-button-primary tryon-generate"
          >
            {loading ? t('tryon.generating') : t('tryon.generate_btn')}
          </button>
        </div>
        {!canGenerate && !loading && (
          <p className="tryon-hint">
            {!personPreviewUrl
              ? zh
                ? '先加入人物照片，再選擇服裝。'
                : 'Add a person photo, then choose clothing.'
              : clothingPreviewUrls.length === 0
                ? zh
                  ? '加入至少一件服裝，即可生成。'
                  : 'Add at least one garment to generate.'
                : zh
                  ? '確認照片與提示詞後即可生成。'
                  : 'Review your photos and prompt before generating.'}
          </p>
        )}
        <CostEstimateBadge quantity={quantity} />
        {error && <ErrorDisplay message={error} />}
      </div>
    </div>
  );
}
