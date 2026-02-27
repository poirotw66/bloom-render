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
        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          {t('tryon.label.output_size')}
          {!supportsMultiRes && (
            <span className="ml-2 text-xs font-normal normal-case text-gray-500">
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-cyan-500/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {t(`tryon.size.${size}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          {t('tryon.label.aspect_ratio')}
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {TRYON_ASPECT_RATIOS.map((ratio) => {
            const isActive = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => !disabled && onAspectRatioChange(ratio)}
                disabled={disabled}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-cyan-500/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
