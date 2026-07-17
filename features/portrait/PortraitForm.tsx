/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { supportsMultiResolution } from '../../services/gemini/shared';
import { PORTRAIT_TYPES, PORTRAIT_OUTPUT_SPECS } from '../../constants/portrait';
import type { PortraitType, OutputSpec } from '../../types';
import { UI_FORM_CARD, UI_LABEL, UI_SELECT, uiOption } from '../../utils/uiClasses';

const IMAGE_SIZES = ['1K', '2K', '4K'] as const;
type ImageSize = (typeof IMAGE_SIZES)[number];

interface PortraitFormProps {
  portraitType: PortraitType;
  setPortraitType: (v: PortraitType) => void;
  portraitOutputSpec: OutputSpec;
  setPortraitOutputSpec: (v: OutputSpec) => void;
  imageSize: ImageSize;
  setImageSize: (v: ImageSize) => void;
  disabled?: boolean;
}

const PortraitForm: React.FC<PortraitFormProps> = ({
  portraitType,
  setPortraitType,
  portraitOutputSpec,
  setPortraitOutputSpec,
  imageSize,
  setImageSize,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const { model } = useSettings();
  const supportsMultiRes = supportsMultiResolution(model);

  return (
    <div className={UI_FORM_CARD}>
      <div>
        <label className={UI_LABEL}>{t('portrait.label.type')}</label>
        <select
          value={portraitType}
          onChange={(e) => setPortraitType(e.target.value as PortraitType)}
          disabled={disabled}
          className={UI_SELECT}
        >
          {PORTRAIT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {t(type.nameKey)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={UI_LABEL}>{t('portrait.label.spec')}</label>
        <div className="flex flex-wrap gap-2">
          {PORTRAIT_OUTPUT_SPECS.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => setPortraitOutputSpec(spec.id)}
              disabled={disabled}
              className={uiOption(portraitOutputSpec === spec.id)}
            >
              {t(spec.nameKey)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={UI_LABEL}>
          {t('common.output_size')}
          {!supportsMultiRes && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({t('common.gemini2_only_1k')})
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {IMAGE_SIZES.map((size) => {
            const isActive = imageSize === size;
            const isDisabled = disabled || (!supportsMultiRes && size !== '1K');
            return (
              <button
                key={size}
                type="button"
                onClick={() => setImageSize(size)}
                disabled={isDisabled}
                className={uiOption(isActive)}
              >
                {t(`common.size_${size.toLowerCase()}`)}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">{t('idphoto.model_recommendation')}</p>
    </div>
  );
};

export default PortraitForm;
