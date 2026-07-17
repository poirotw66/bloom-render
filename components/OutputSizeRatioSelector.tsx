/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared output size and aspect ratio selectors.
 * Gemini 3: 1K / 2K / 4K; Gemini 2: 1K only. Ratios: 1:1, 16:9, 9:16.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { supportsMultiResolution } from '../services/gemini/shared';
import { UI_LABEL, uiOption } from '../utils/uiClasses';

export type OutputSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16';

const OUTPUT_SIZES: OutputSize[] = ['1K', '2K', '4K'];
const ASPECT_RATIOS: AspectRatio[] = ['1:1', '16:9', '9:16'];

const SIZE_KEY: Record<OutputSize, string> = {
  '1K': 'common.size_1k',
  '2K': 'common.size_2k',
  '4K': 'common.size_4k',
};
const RATIO_KEY: Record<AspectRatio, string> = {
  '1:1': 'common.ratio_1_1',
  '16:9': 'common.ratio_16_9',
  '9:16': 'common.ratio_9_16',
};

interface OutputSizeRatioSelectorProps {
  outputSize: OutputSize;
  aspectRatio: AspectRatio;
  onOutputSizeChange: (size: OutputSize) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
  className?: string;
}

const OutputSizeRatioSelector: React.FC<OutputSizeRatioSelectorProps> = ({
  outputSize,
  aspectRatio,
  onOutputSizeChange,
  onAspectRatioChange,
  disabled = false,
  className = '',
}) => {
  const { t } = useLanguage();
  const { model } = useSettings();
  const supportsMultiRes = supportsMultiResolution(model);
  const allowedSizes: OutputSize[] = supportsMultiRes ? OUTPUT_SIZES : ['1K'];

  return (
    <div className={`flex flex-col gap-6 w-full max-w-2xl mx-auto ${className}`}>
      <div className="flex flex-col sm:flex-row flex-wrap gap-6">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <label className={UI_LABEL}>
            {t('common.output_size')}
            {!supportsMultiRes && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({t('common.gemini2_only_1k')})
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
                  {t(SIZE_KEY[size])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <label className={UI_LABEL}>{t('common.aspect_ratio')}</label>
          <div className="flex flex-wrap justify-center gap-2">
            {ASPECT_RATIOS.map((ratio) => {
              const isActive = aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => !disabled && onAspectRatioChange(ratio)}
                  disabled={disabled}
                  className={uiOption(isActive)}
                >
                  {t(RATIO_KEY[ratio])}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputSizeRatioSelector;
