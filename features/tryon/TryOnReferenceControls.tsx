import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnOptionalReferenceRole } from '../../types/tryOnRecipe';
import { REFERENCE_ROLE_LABELS } from './TryOnMaterialPicker';
import './tryon-reference-controls.css';

interface TryOnReferenceControlsProps {
  keepBackground: boolean;
  keepPose: boolean;
  referencePreviewUrls: Partial<Record<TryOnOptionalReferenceRole, string>>;
  onKeepBackgroundChange: (keep: boolean) => void;
  onKeepPoseChange: (keep: boolean) => void;
  onReferenceChange: (role: TryOnOptionalReferenceRole, file: File | null) => void;
  disabled?: boolean;
}

const OPTIONAL_ROLES: TryOnOptionalReferenceRole[] = ['pose', 'expression', 'scene', 'lighting'];

export default function TryOnReferenceControls({
  keepBackground,
  keepPose,
  referencePreviewUrls,
  onKeepBackgroundChange,
  onKeepPoseChange,
  onReferenceChange,
  disabled = false,
}: TryOnReferenceControlsProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const backgroundOverride = Boolean(referencePreviewUrls.scene || referencePreviewUrls.lighting);
  const poseOverride = Boolean(referencePreviewUrls.pose);

  return (
    <fieldset className="tryon-reference-controls">
      <legend id="tryon-controls-title" className="tryon-subheading">
        {zh ? '構圖與參考圖' : 'Composition and references'}
      </legend>
      <div className="tryon-preservation-grid">
        <label className="tryon-preservation">
          <span>{zh ? '保留原背景與光線' : 'Keep original background and light'}</span>
          <input
            type="checkbox"
            data-testid="tryon-keep-background"
            checked={keepBackground && !backgroundOverride}
            onChange={(event) => onKeepBackgroundChange(event.target.checked)}
            disabled={disabled || backgroundOverride}
            className="h-5 w-5 shrink-0 accent-rose-500"
          />
        </label>
        <label className="tryon-preservation">
          <span>{zh ? '保留原姿勢' : 'Keep original pose'}</span>
          <input
            type="checkbox"
            data-testid="tryon-keep-pose"
            checked={keepPose && !poseOverride}
            onChange={(event) => onKeepPoseChange(event.target.checked)}
            disabled={disabled || poseOverride}
            className="h-5 w-5 shrink-0 accent-rose-500"
          />
        </label>
      </div>
      {(backgroundOverride || poseOverride) && (
        <p role="status" className="tryon-hint">
          {[
            backgroundOverride &&
              (zh
                ? '場景或光線參考會優先於保留原背景。'
                : 'Scene or lighting references override the original background setting.'),
            poseOverride &&
              (zh
                ? '姿勢參考會優先於保留原姿勢。'
                : 'The pose reference overrides the original pose setting.'),
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
      )}
      <details className="tryon-disclosure" open={Object.keys(referencePreviewUrls).length > 0}>
        <summary className="tryon-disclosure-title">
          {zh ? '上傳其他參考圖（選填）' : 'Upload extra references (optional)'}
        </summary>
        <div className="tryon-reference-grid">
          {OPTIONAL_ROLES.map((role) => {
            const title = REFERENCE_ROLE_LABELS[role][zh ? 1 : 0];
            const preview = referencePreviewUrls[role];
            return (
              <div key={role} className="tryon-reference-field">
                <label className="tryon-field">
                  <span>{title}</span>
                  <input
                    type="file"
                    data-testid={`tryon-reference-${role}`}
                    accept="image/*"
                    aria-label={
                      zh ? `上傳${title}參考圖` : `Upload ${title.toLowerCase()} reference`
                    }
                    disabled={disabled}
                    className="tryon-reference-input"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onReferenceChange(role, file);
                      event.target.value = '';
                    }}
                  />
                </label>
                {preview && (
                  <div className="tryon-reference-preview">
                    <img
                      src={preview}
                      alt={zh ? `${title}參考圖` : `${title} reference`}
                      className="h-24 w-20 rounded-lg object-contain bg-gray-950"
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onReferenceChange(role, null)}
                      className="tool-button tool-button-secondary"
                    >
                      {zh ? `移除${title}` : `Remove ${title.toLowerCase()}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>
    </fieldset>
  );
}
