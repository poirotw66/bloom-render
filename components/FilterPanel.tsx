/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    {
      name: t('panel.filter.synthwave'),
      prompt:
        'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.',
    },
    {
      name: t('panel.filter.anime'),
      prompt:
        'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.',
    },
    {
      name: t('panel.filter.lomo'),
      prompt:
        'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.',
    },
    {
      name: t('panel.filter.glitch'),
      prompt:
        'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.',
    },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div
      className={`w-full rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm ${
        theme === 'newyear'
          ? 'bg-red-900/30 border border-red-700/50'
          : theme === 'bloom'
            ? 'bg-gray-800/50 border border-fuchsia-500/20'
            : 'bg-gray-800/50 border border-gray-700'
      }`}
    >
      <h3
        className={`text-lg font-semibold text-center ${
          theme === 'newyear'
            ? 'text-red-200'
            : theme === 'bloom'
              ? 'text-gray-200'
              : 'text-gray-300'
        }`}
      >
        {t('panel.filter.title')}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-white/10 border border-transparent font-semibold py-3 px-4 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              theme === 'newyear'
                ? `text-red-200 ${selectedPresetPrompt === preset.prompt ? 'ring-red-500' : ''} focus:ring-red-500`
                : theme === 'bloom'
                  ? `text-gray-200 ${selectedPresetPrompt === preset.prompt ? 'ring-fuchsia-500' : ''} focus:ring-fuchsia-500`
                  : `text-gray-200 ${selectedPresetPrompt === preset.prompt ? 'ring-blue-500' : ''} focus:ring-blue-500`
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder={t('panel.filter.placeholder')}
        className={`flex-grow rounded-lg p-4 focus:ring-2 focus:outline-none transition-colors duration-200 w-full disabled:cursor-not-allowed disabled:opacity-60 text-base ${
          theme === 'newyear'
            ? 'bg-red-900/30 border border-red-700/50 text-red-50 placeholder-red-300 focus:ring-red-500'
            : theme === 'bloom'
              ? 'bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-fuchsia-500'
              : 'bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-blue-500'
        }`}
        disabled={isLoading}
        aria-label={t('panel.filter.placeholder')}
      />

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <button
            onClick={handleApply}
            className={`w-full bg-gradient-to-br text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              theme === 'newyear'
                ? 'from-red-600 to-red-500 shadow-red-500/20 hover:shadow-red-500/40 disabled:from-red-800 disabled:to-red-700 focus:ring-red-500'
                : theme === 'bloom'
                  ? 'from-fuchsia-600 to-pink-500 shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 disabled:from-fuchsia-800 disabled:to-pink-800 focus:ring-fuchsia-500'
                  : 'from-blue-600 to-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40 disabled:from-blue-800 disabled:to-blue-700 focus:ring-blue-500'
            }`}
            disabled={isLoading || !activePrompt.trim()}
          >
            {t('panel.filter.apply')}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
