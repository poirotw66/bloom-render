import React, { useId, useRef } from 'react';
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
  variant?: 'all' | 'pose' | 'extra';
  onChoosePose?: () => void;
}

function ReferenceUpload({
  role,
  preview,
  disabled,
  onChange,
}: {
  role: TryOnOptionalReferenceRole;
  preview?: string;
  disabled: boolean;
  onChange: TryOnReferenceControlsProps['onReferenceChange'];
}) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const title = REFERENCE_ROLE_LABELS[role][zh ? 1 : 0];
  return (
    <div className="tryon-reference-field">
      <label htmlFor={id} className="tryon-reference-label">
        {title}
      </label>
      <input
        id={id}
        ref={input}
        type="file"
        data-testid={`tryon-reference-${role}`}
        accept="image/*"
        aria-label={zh ? `上傳${title}參考圖` : `Upload ${title.toLowerCase()} reference`}
        disabled={disabled}
        className="tryon-reference-input"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(role, file);
          event.target.value = '';
        }}
      />
      <div className="tryon-role-actions">
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="tool-button tool-button-secondary"
        >
          {zh ? `上傳${title}參考圖` : `Upload ${title.toLowerCase()} reference`}
        </button>
      </div>
      {preview && (
        <div className="tryon-reference-preview">
          <img
            src={preview}
            alt={zh ? `${title}參考圖` : `${title} reference`}
            width="100"
            height="120"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(role, null)}
            className="tool-button tool-button-secondary"
          >
            {zh ? `移除${title}` : `Remove ${title.toLowerCase()}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TryOnReferenceControls({
  keepBackground,
  keepPose,
  referencePreviewUrls,
  onKeepBackgroundChange,
  onKeepPoseChange,
  onReferenceChange,
  disabled = false,
  variant = 'all',
  onChoosePose,
}: TryOnReferenceControlsProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const backgroundOverride = Boolean(referencePreviewUrls.scene || referencePreviewUrls.lighting);
  const poseOverride = Boolean(referencePreviewUrls.pose);
  const showBackground = variant !== 'pose';
  const showPose = variant !== 'extra';
  const extraRoles: TryOnOptionalReferenceRole[] = ['expression', 'scene', 'lighting'];
  return (
    <fieldset
      className={`tryon-reference-controls${variant === 'pose' ? ' tryon-workflow-step tryon-pose-step' : ''}`}
    >
      <legend className="tryon-subheading">
        {variant === 'pose' ? (
          <span className="tryon-step-heading">
            <span className="tryon-step-number">03</span>
            <span>{zh ? '姿勢與機位' : 'Pose and camera'}</span>
            <span className="tryon-step-state">{zh ? '選填' : 'Optional'}</span>
          </span>
        ) : zh ? (
          '構圖與參考圖'
        ) : (
          'Composition and references'
        )}
      </legend>
      <div className="tryon-preservation-grid">
        {showBackground && (
          <label className="tryon-preservation">
            <span>{zh ? '保留原背景與光線' : 'Keep original background and light'}</span>
            <input
              type="checkbox"
              data-testid="tryon-keep-background"
              checked={keepBackground && !backgroundOverride}
              onChange={(event) => onKeepBackgroundChange(event.target.checked)}
              disabled={disabled || backgroundOverride}
            />
          </label>
        )}
        {showPose && (
          <label className="tryon-preservation">
            <span>{zh ? '保留原姿勢' : 'Keep original pose'}</span>
            <input
              type="checkbox"
              data-testid="tryon-keep-pose"
              checked={keepPose && !poseOverride}
              onChange={(event) => onKeepPoseChange(event.target.checked)}
              disabled={disabled || poseOverride}
            />
          </label>
        )}
      </div>
      {((showBackground && backgroundOverride) || (showPose && poseOverride)) && (
        <p role="status" className="tryon-hint">
          {[
            showBackground &&
              backgroundOverride &&
              (zh
                ? '場景或光線參考會優先於保留原背景。'
                : 'Scene or lighting references override the original background setting.'),
            showPose &&
              poseOverride &&
              (zh
                ? '姿勢參考會優先於保留原姿勢。'
                : 'The pose reference overrides the original pose setting.'),
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
      )}
      {variant === 'pose' ? (
        <div className="tryon-pose-actions">
          {onChoosePose && (
            <button
              type="button"
              className="tool-button tool-button-secondary"
              disabled={disabled}
              onClick={onChoosePose}
            >
              {zh ? '挑選姿勢' : 'Choose pose'}
            </button>
          )}
          <ReferenceUpload
            role="pose"
            preview={referencePreviewUrls.pose}
            disabled={disabled}
            onChange={onReferenceChange}
          />
        </div>
      ) : (
        <details
          className="tryon-disclosure"
          open={Object.keys(referencePreviewUrls).some(
            (role) => variant === 'all' || role !== 'pose',
          )}
        >
          <summary className="tryon-disclosure-title">
            {zh ? '上傳其他參考圖（選填）' : 'Upload extra references (optional)'}
          </summary>
          <div className="tryon-reference-grid">
            {(variant === 'all' ? ['pose' as const, ...extraRoles] : extraRoles).map((role) => (
              <ReferenceUpload
                key={role}
                role={role}
                preview={referencePreviewUrls[role]}
                disabled={disabled}
                onChange={onReferenceChange}
              />
            ))}
          </div>
        </details>
      )}
    </fieldset>
  );
}
