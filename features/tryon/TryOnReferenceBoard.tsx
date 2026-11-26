import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnOptionalReferenceRole } from '../../types/tryOnRecipe';
import { REFERENCE_ROLE_LABELS } from './TryOnMaterialPicker';

interface TryOnReferenceBoardProps {
  personPreviewUrl: string | null;
  clothingPreviewUrls: string[];
  referencePreviewUrls: Partial<Record<TryOnOptionalReferenceRole, string>>;
  keepPose: boolean;
  onChooseClothing: () => void;
  onChoosePose: () => void;
  disabled: boolean;
}

export default function TryOnReferenceBoard({
  personPreviewUrl,
  clothingPreviewUrls,
  referencePreviewUrls,
  keepPose,
  onChooseClothing,
  onChoosePose,
  disabled,
}: TryOnReferenceBoardProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  return (
    <div
      className="tryon-reference-board"
      data-testid="tryon-reference-board"
      aria-label={zh ? '本次試穿參考畫板' : 'Current try-on references'}
    >
      <div className="tryon-board-heading">
        <h3>{zh ? '本次試穿' : 'Your next look'}</h3>
        <span className="tryon-count">
          {1 +
            clothingPreviewUrls.length +
            Object.keys(referencePreviewUrls).length -
            (personPreviewUrl ? 0 : 1)}{' '}
          {zh ? '張參考圖' : 'references'}
        </span>
      </div>
      <div className="tryon-board-grid">
        <div className="tryon-board-person">
          <span className="tryon-board-label">{zh ? '人物' : 'Person'}</span>
          {personPreviewUrl ? (
            <img
              src={personPreviewUrl}
              alt={zh ? '本次人物照片' : 'Selected person'}
              width="400"
              height="520"
            />
          ) : (
            <div className="tryon-board-empty">
              <span aria-hidden="true">01</span>
              <p>{zh ? '加入人物照片' : 'Add a person photo'}</p>
            </div>
          )}
        </div>
        <div className="tryon-board-references">
          <div className="tryon-board-slot">
            <div className="tryon-board-label">{zh ? '服裝' : 'Clothing'}</div>
            {clothingPreviewUrls.length ? (
              <div className="tryon-board-garments">
                {clothingPreviewUrls.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${zh ? '已選服裝' : 'Selected clothing'} ${i + 1}`}
                    width="180"
                    height="200"
                  />
                ))}
              </div>
            ) : (
              <button
                type="button"
                className="tryon-board-empty"
                disabled={disabled}
                onClick={onChooseClothing}
              >
                <span aria-hidden="true">＋</span>
                <span>{zh ? '加入服裝參考' : 'Add clothing reference'}</span>
              </button>
            )}
          </div>
          <div className="tryon-board-slot">
            <div className="tryon-board-label">{zh ? '姿勢' : 'Pose'}</div>
            {referencePreviewUrls.pose ? (
              <img
                src={referencePreviewUrls.pose}
                alt={zh ? '已選姿勢' : 'Selected pose'}
                width="180"
                height="200"
              />
            ) : (
              <button
                type="button"
                className="tryon-board-empty"
                disabled={disabled}
                onClick={onChoosePose}
              >
                <span className="tryon-board-pose-mark" aria-hidden="true">
                  ↗
                </span>
                <span>
                  {keepPose
                    ? zh
                      ? '沿用人物姿勢'
                      : 'Keep original pose'
                    : zh
                      ? '自然展示服裝'
                      : 'Natural fashion pose'}
                </span>
                <span className="tryon-board-link">{zh ? '更換姿勢' : 'Change pose'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {(['expression', 'scene', 'lighting'] as const).some(
        (role) => referencePreviewUrls[role],
      ) && (
        <div className="tryon-board-extras">
          {(['expression', 'scene', 'lighting'] as const).flatMap((role) =>
            referencePreviewUrls[role]
              ? [
                  <div key={role}>
                    <span className="tryon-board-label">
                      {REFERENCE_ROLE_LABELS[role][zh ? 1 : 0]}
                    </span>
                    <img
                      src={referencePreviewUrls[role]}
                      alt={`${REFERENCE_ROLE_LABELS[role][zh ? 1 : 0]} ${zh ? '參考圖' : 'reference'}`}
                      width="120"
                      height="120"
                    />
                  </div>,
                ]
              : [],
          )}
        </div>
      )}
      <p className="tryon-hint">
        {zh
          ? '人物決定外貌，服裝決定穿搭；姿勢參考只控制動作與機位。'
          : 'Your photo sets identity. Clothing sets the outfit. Pose references control posture and camera angle.'}
      </p>
    </div>
  );
}
