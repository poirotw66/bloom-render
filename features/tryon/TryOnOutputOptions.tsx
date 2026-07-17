/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Output size and aspect ratio selectors for try-on.
 * Gemini 3: 1K / 2K / 4K; Gemini 2: 1K only. Both: 1:1, 16:9, 9:16.
 */

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
import { UI_LABEL, uiOption } from '../../utils/uiClasses';

interface TryOnOutputOptionsProps {
  outputSize: TryOnOutputSize;
  aspectRatio: TryOnAspectRatio;
  onOutputSizeChange: (size: TryOnOutputSize) => void;
  onAspectRatioChange: (ratio: TryOnAspectRatio) => void;
  disabled?: boolean;
}

const TryOnOutputOptions: React.FC<TryOnOutputOptionsProps> = ({
  outputSize,
  aspectRatio,
  onOutputSizeChange,
  onAspectRatioChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const { model } = useSettings();
  const supportsMultiRes = supportsMultiResolution(model);
  const allowedSizes: TryOnOutputSize[] = supportsMultiRes ? TRYON_OUTPUT_SIZES : ['1K'];

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-3">
        <label className={UI_LABEL}>
          {t('tryon.label.output_size')}
          {!supportsMultiRes && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({t('tryon.gemini2_only_1k')})
            </span>
          )}
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {allowedSizes.map((size) => {
            const isActive = outputSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => !disabled && onOutputSizeChange(size)}
                disabled={disabled}
                className={uiOption(isActive)}
              >
                {t(`tryon.size.${size}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className={UI_LABEL}>{t('tryon.label.aspect_ratio')}</label>
        <div className="flex flex-wrap justify-center gap-2">
          {TRYON_ASPECT_RATIOS.map((ratio) => {
            const isActive = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => !disabled && onAspectRatioChange(ratio)}
                disabled={disabled}
                className={uiOption(isActive)}
              >
                {t(`tryon.ratio.${ratio.replace(':', '_')}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TryOnOutputOptions;
