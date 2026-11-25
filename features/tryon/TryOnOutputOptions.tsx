import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { supportsMultiResolution } from '../../services/gemini/shared';
import {
  TRYON_OUTPUT_SIZES,
  TRYON_ASPECT_RATIOS,
  type TryOnOutputSize,
  type TryOnAspectRatio,
} from './types';

interface TryOnOutputOptionsProps {
  outputSize: TryOnOutputSize;
  aspectRatio: TryOnAspectRatio;
  onOutputSizeChange: (size: TryOnOutputSize) => void;
  onAspectRatioChange: (ratio: TryOnAspectRatio) => void;
  disabled?: boolean;
}

export default function TryOnOutputOptions({
  outputSize,
  aspectRatio,
  onOutputSizeChange,
  onAspectRatioChange,
  disabled = false,
}: TryOnOutputOptionsProps) {
  const { t, language } = useLanguage();
  const { effectiveModel } = useSettings();
  const multiResolution = supportsMultiResolution(effectiveModel);
  const allowedSizes: TryOnOutputSize[] = multiResolution ? TRYON_OUTPUT_SIZES : ['1K'];
  return (
    <div className="tryon-field-grid">
      <label className="tryon-field">
        <span>{t('tryon.label.output_size')}</span>
        <select
          value={multiResolution ? outputSize : '1K'}
          onChange={(event) => onOutputSizeChange(event.target.value as TryOnOutputSize)}
          disabled={disabled}
          className="tool-control"
        >
          {allowedSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {!multiResolution && (
          <span className="tryon-hint">
            {language === 'zh-TW'
              ? '目前模型輸出 1K 圖片。'
              : 'The selected model outputs 1K images.'}
          </span>
        )}
      </label>
      <label className="tryon-field">
        <span>{t('tryon.label.aspect_ratio')}</span>
        <select
          value={aspectRatio}
          onChange={(event) => onAspectRatioChange(event.target.value as TryOnAspectRatio)}
          disabled={disabled}
          className="tool-control"
        >
          {TRYON_ASPECT_RATIOS.map((ratio) => (
            <option key={ratio} value={ratio}>
              {ratio}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
