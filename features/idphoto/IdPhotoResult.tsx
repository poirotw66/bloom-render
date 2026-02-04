/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  ID_PHOTO_TYPES,
  RETOUCH_LEVELS,
  OUTPUT_SPECS,
  CLOTHING_OPTIONS,
} from '../../constants/idPhoto';
import type { IdPhotoType, RetouchLevel, OutputSpec, ClothingOption } from '../../constants/idPhoto';

interface IdPhotoResultProps {
  idPhotoResult: string;
  idPhotoType: IdPhotoType;
  idPhotoRetouchLevel: RetouchLevel;
  idPhotoOutputSpec: OutputSpec;
  idPhotoClothingOption: ClothingOption;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const IdPhotoResult: React.FC<IdPhotoResultProps> = ({
  idPhotoResult,
  idPhotoType,
  idPhotoRetouchLevel,
  idPhotoOutputSpec,
  idPhotoClothingOption,
  onDownload,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();
  const settings = useSettings();

  return (
    <div className="flex flex-col items-center gap-4 w-full animate-fade-in bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div className="w-full aspect-[3/4] max-h-[400px] rounded-lg overflow-hidden border-2 border-gray-600 bg-white flex items-center justify-center shadow-lg">
        <img src={idPhotoResult} alt="ID photo" className="max-w-full max-h-full w-auto h-auto object-contain" />
      </div>
      <div className="w-full bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <h3 className="text-sm font-bold text-white mb-3">{t('idphoto.result.params_title')}</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('idphoto.label.type')}</span>
            <span className="text-gray-200">{t(ID_PHOTO_TYPES.find(x => x.id === idPhotoType)?.nameKey ?? '')}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('idphoto.label.level')}</span>
            <span className="text-gray-200">{t(RETOUCH_LEVELS.find(x => x.id === idPhotoRetouchLevel)?.nameKey ?? '')}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('idphoto.label.spec')}</span>
            <span className="text-gray-200">{t(OUTPUT_SPECS.find(x => x.id === idPhotoOutputSpec)?.nameKey ?? '')}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('idphoto.label.clothing')}</span>
            <span className="text-gray-200">{t(CLOTHING_OPTIONS.find(x => x.id === idPhotoClothingOption)?.nameKey ?? '')}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('settings.model')}</span>
            <span className="text-gray-200">{settings.model === 'gemini-3-pro-image-preview' ? t('settings.model.pro') : t('settings.model.flash')}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={onDownload}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all text-sm active:scale-95"
        >
          {t('start.idphoto_download')}
        </button>
        <button
          onClick={onEditInEditor}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all text-sm active:scale-95"
        >
          {t('start.idphoto_edit')}
        </button>
      </div>
    </div>
  );
};

export default IdPhotoResult;
