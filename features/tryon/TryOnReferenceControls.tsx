import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnOptionalReferenceRole } from '../../types/tryOnRecipe';
import { UI_BTN_SECONDARY } from '../../utils/uiClasses';
import { REFERENCE_ROLE_LABELS } from './TryOnMaterialPicker';

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
    <section className="space-y-4" aria-labelledby="tryon-controls-title">
      <h2 id="tryon-controls-title" className="text-lg font-semibold theme-ink">
        {zh ? '構圖與參考圖' : 'Composition and references'}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 rounded-xl border theme-border p-3 text-sm theme-ink">
          <input
            type="checkbox"
            data-testid="tryon-keep-background"
            checked={keepBackground && !backgroundOverride}
            onChange={(event) => onKeepBackgroundChange(event.target.checked)}
            disabled={disabled || backgroundOverride}
            className="h-5 w-5 shrink-0 accent-rose-500"
          />
          {zh ? '保留原背景與光線' : 'Keep original background and light'}
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border theme-border p-3 text-sm theme-ink">
          <input
            type="checkbox"
            data-testid="tryon-keep-pose"
            checked={keepPose && !poseOverride}
            onChange={(event) => onKeepPoseChange(event.target.checked)}
            disabled={disabled || poseOverride}
            className="h-5 w-5 shrink-0 accent-rose-500"
          />
          {zh ? '保留原姿勢' : 'Keep original pose'}
        </label>
      </div>
      {(backgroundOverride || poseOverride) && (
        <p role="status" className="text-sm text-amber-200">
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
      <details
        className="rounded-xl border theme-border p-3"
        open={Object.keys(referencePreviewUrls).length > 0}
      >
        <summary className="min-h-11 flex items-center cursor-pointer text-sm font-medium theme-ink">
          {zh ? '上傳其他參考圖（選填）' : 'Upload extra references (optional)'}
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
          {OPTIONAL_ROLES.map((role) => {
            const title = REFERENCE_ROLE_LABELS[role][zh ? 1 : 0];
            const preview = referencePreviewUrls[role];
            return (
              <div key={role} className="space-y-2 min-w-0">
                <label className="flex min-h-11 flex-col gap-2 text-sm theme-ink">
                  <span>{title}</span>
                  <input
                    type="file"
                    data-testid={`tryon-reference-${role}`}
                    accept="image/*"
                    aria-label={
                      zh ? `上傳${title}參考圖` : `Upload ${title.toLowerCase()} reference`
                    }
                    disabled={disabled}
                    className="block w-full min-h-11 text-xs theme-ink-muted file:mr-2 file:rounded-lg file:border-0 file:px-3 file:py-3 file:text-xs file:font-medium file:bg-gray-700 file:text-white"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onReferenceChange(role, file);
                      event.target.value = '';
                    }}
                  />
                </label>
                {preview && (
                  <div className="flex items-center gap-3 rounded-xl theme-raised p-2">
                    <img
                      src={preview}
                      alt={zh ? `${title}參考圖` : `${title} reference`}
                      className="h-24 w-20 rounded-lg object-contain bg-gray-950"
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onReferenceChange(role, null)}
                      className={`${UI_BTN_SECONDARY} min-h-11 text-sm`}
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
    </section>
  );
}
