import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TRYON_BACKGROUNDS, TRYON_STYLES } from '../../constants/tryOn';
import type { TryOnBackgroundId, TryOnStyleId } from '../../constants/tryOn';

interface TryOnOptionSelectorsProps {
  background: TryOnBackgroundId;
  style: TryOnStyleId;
  onBackgroundChange: (id: TryOnBackgroundId) => void;
  onStyleChange: (id: TryOnStyleId) => void;
  disabled?: boolean;
  backgroundDisabled?: boolean;
}

export default function TryOnOptionSelectors({
  background,
  style,
  onBackgroundChange,
  onStyleChange,
  disabled = false,
  backgroundDisabled = false,
}: TryOnOptionSelectorsProps) {
  const { t } = useLanguage();
  return (
    <div className="tryon-field-grid">
      <label className="tryon-field">
        <span>{t('tryon.label.background')}</span>
        <select
          value={background}
          onChange={(event) => onBackgroundChange(event.target.value as TryOnBackgroundId)}
          disabled={disabled || backgroundDisabled}
          className="tool-control"
        >
          {TRYON_BACKGROUNDS.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.nameKey)}
            </option>
          ))}
        </select>
      </label>
      <label className="tryon-field">
        <span>{t('tryon.label.style')}</span>
        <select
          value={style}
          onChange={(event) => onStyleChange(event.target.value as TryOnStyleId)}
          disabled={disabled}
          className="tool-control"
        >
          {TRYON_STYLES.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.nameKey)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
