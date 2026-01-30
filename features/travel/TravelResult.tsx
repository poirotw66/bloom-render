/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TravelResultProps {
  result: string;
  resultSceneNameKey: string | null;
  resultSceneCustomLabel: string | null;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const TravelResult: React.FC<TravelResultProps> = ({
  result,
  resultSceneNameKey,
  resultSceneCustomLabel,
  onDownload,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();
  const sceneLabel = resultSceneNameKey
    ? t(resultSceneNameKey)
    : (resultSceneCustomLabel || t('travel.custom_btn'));

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white">{t('travel.title')}</h3>
      <p className="text-sm text-amber-400/90">
        {t('travel.result_scene_label')} {sceneLabel}
      </p>
      <div className="w-full aspect-[4/3] max-h-[400px] rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex items-center justify-center">
        <img src={result} alt="Travel photo" className="max-w-full max-h-full w-auto h-auto object-contain" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onDownload}
          className="bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {t('travel.download')}
        </button>
        <button
          onClick={onAgain}
          className="bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-lg transition-colors duration-200 hover:bg-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {t('travel.again')}
        </button>
        <button
          onClick={onEditInEditor}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-5 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {t('travel.edit_in_editor')}
        </button>
      </div>
    </div>
  );
};

export default TravelResult;
