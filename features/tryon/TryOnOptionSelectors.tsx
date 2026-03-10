/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Background and style selectors for AI try-on (catalog-style output).
 */

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
}

const TryOnOptionSelectors: React.FC<TryOnOptionSelectorsProps> = ({
  background,
  style,
  onBackgroundChange,
  onStyleChange,
  disabled = false,
}) => {
  const { t } = useLanguage();

  const selectedBg = TRYON_BACKGROUNDS.find((b) => b.id === background);
  const selectedStyle = TRYON_STYLES.find((s) => s.id === style);

  return (
    <div className="flex flex-col gap-10 w-full max-w-3xl mx-auto">
      {/* Background Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            {t('tryon.label.background')}
          </label>
          <span className="text-xs font-medium text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
            {selectedBg ? t(selectedBg.nameKey) : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {TRYON_BACKGROUNDS.map((opt) => {
            const isActive = background === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => !disabled && onBackgroundChange(opt.id)}
                disabled={disabled}
                className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/20 scale-105 z-10'
                    : 'bg-gray-800/40 text-gray-400 border border-gray-700/50 hover:bg-gray-700/60 hover:border-teal-500/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
              >
                <span
                  className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                >
                  {opt.emoji}
                </span>
                <span
                  className={`text-[10px] font-bold truncate w-full text-center ${isActive ? 'text-white' : 'text-gray-500'}`}
                >
                  {t(opt.nameKey).split(' ').pop()}
                </span>
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedBg && (
          <p className="text-[11px] text-gray-500 italic mt-1 px-1 leading-relaxed animate-fade-in">
            ✨ {selectedBg.promptHint.split('.')[0]}.
          </p>
        )}
      </div>

      {/* Style & Mood Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {t('tryon.label.style')}
          </label>
          <span className="text-xs font-medium text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            {selectedStyle ? t(selectedStyle.nameKey) : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {TRYON_STYLES.map((opt) => {
            const isActive = style === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => !disabled && onStyleChange(opt.id)}
                disabled={disabled}
                className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/20 scale-105 z-10'
                    : 'bg-gray-800/40 text-gray-400 border border-gray-700/50 hover:bg-gray-700/60 hover:border-amber-500/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
              >
                <span
                  className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                >
                  {opt.emoji}
                </span>
                <span
                  className={`text-[10px] font-bold truncate w-full text-center ${isActive ? 'text-white' : 'text-gray-500'}`}
                >
                  {t(opt.nameKey).split(' ').pop()}
                </span>
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedStyle && (
          <p className="text-[11px] text-gray-500 italic mt-1 px-1 leading-relaxed animate-fade-in">
            🎨 {selectedStyle.promptHint.split('.')[0]}.
          </p>
        )}
      </div>
    </div>
  );
};

export default TryOnOptionSelectors;
