/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = 'free' | '1:1' | '16:9' | 'id_2in_head' | 'id_2in_half' | 'id_1in';

const CropPanel: React.FC<CropPanelProps> = ({
  onApplyCrop,
  onSetAspect,
  isLoading,
  isCropping,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free');

  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  };

  const aspects: { name: AspectRatio; value: number | undefined; label: string; title?: string }[] =
    [
      { name: 'free', value: undefined, label: t('panel.crop.free') },
      { name: '1:1', value: 1 / 1, label: '1:1' },
      { name: '16:9', value: 16 / 9, label: '16:9' },
      {
        name: 'id_2in_head',
        value: 3.5 / 4.5,
        label: t('panel.crop.id_2in_head'),
        title: t('panel.crop.id_2in_head_title'),
      },
      {
        name: 'id_2in_half',
        value: 4.2 / 4.7,
        label: t('panel.crop.id_2in_half'),
        title: t('panel.crop.id_2in_half_title'),
      },
      {
        name: 'id_1in',
        value: 2.8 / 3.5,
        label: t('panel.crop.id_1in'),
        title: t('panel.crop.id_1in_title'),
      },
    ];

  return (
    <div
      className={`w-full rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm ${
        theme === 'newyear'
          ? 'bg-red-900/30 border border-red-700/50'
          : theme === 'bloom'
            ? 'bg-gray-800/50 border border-fuchsia-500/20'
            : 'bg-gray-800/50 border border-gray-700'
      }`}
    >
      <h3
        className={`text-xl font-semibold ${
          theme === 'newyear'
            ? 'text-red-200'
            : theme === 'bloom'
              ? 'text-gray-200'
              : 'text-gray-300'
        }`}
      >
        {t('panel.crop.title')}
      </h3>
      <p
        className={`text-base -mt-2 leading-relaxed ${
          theme === 'newyear'
            ? 'text-red-300'
            : theme === 'bloom'
              ? 'text-gray-300'
              : 'text-gray-400'
        }`}
      >
        {t('panel.crop.instr')}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-sm font-medium ${
            theme === 'newyear'
              ? 'text-red-300'
              : theme === 'bloom'
                ? 'text-gray-300'
                : 'text-gray-400'
          }`}
        >
          {t('panel.crop.aspect')}
        </span>
        {aspects.map(({ name, value, label, title }) => (
          <button
            key={name}
            onClick={() => handleAspectChange(name, value)}
            disabled={isLoading}
            title={title}
            className={`px-4 py-2 rounded-md text-base font-semibold transition-colors duration-200 active:scale-95 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              activeAspect === name
                ? theme === 'newyear'
                  ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-md shadow-red-500/20 focus:ring-red-500'
                  : theme === 'bloom'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-500 text-white shadow-md shadow-fuchsia-500/20 focus:ring-fuchsia-500'
                    : 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 focus:ring-blue-500'
                : theme === 'newyear'
                  ? 'bg-white/10 hover:bg-white/20 text-red-200 focus:ring-red-500'
                  : theme === 'bloom'
                    ? 'bg-white/10 hover:bg-white/20 text-gray-200 focus:ring-fuchsia-500'
                    : 'bg-white/10 hover:bg-white/20 text-gray-200 focus:ring-blue-500'
            } disabled:cursor-not-allowed`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        {t('panel.crop.apply')}
      </button>
    </div>
  );
};

export default CropPanel;
