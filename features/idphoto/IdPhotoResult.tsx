/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import GenericResult from '../../components/GenericResult';
import {
  ID_PHOTO_TYPES,
  RETOUCH_LEVELS,
  OUTPUT_SPECS,
  CLOTHING_OPTIONS,
} from '../../constants/idPhoto';
import type {
  IdPhotoType,
  RetouchLevel,
  OutputSpec,
  ClothingOption,
} from '../../constants/idPhoto';

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
    <GenericResult
      result={idPhotoResult}
      onDownload={onDownload}
      onAgain={onAgain}
      onEditInEditor={onEditInEditor}
      paramsTitleKey="idphoto.result.params_title"
      params={[
        {
          labelKey: 'idphoto.label.type',
          value: t(ID_PHOTO_TYPES.find((x) => x.id === idPhotoType)?.nameKey ?? ''),
        },
        {
          labelKey: 'idphoto.label.level',
          value: t(RETOUCH_LEVELS.find((x) => x.id === idPhotoRetouchLevel)?.nameKey ?? ''),
        },
        {
          labelKey: 'idphoto.label.spec',
          value: t(OUTPUT_SPECS.find((x) => x.id === idPhotoOutputSpec)?.nameKey ?? ''),
        },
        {
          labelKey: 'idphoto.label.clothing',
          value: t(CLOTHING_OPTIONS.find((x) => x.id === idPhotoClothingOption)?.nameKey ?? ''),
        },
        {
          labelKey: 'settings.model',
          value:
            settings.model === 'gemini-3-pro-image-preview'
              ? t('settings.model.pro')
              : settings.model === 'gemini-3.1-flash-image-preview'
                ? t('settings.model.flash31')
                : t('settings.model.flash'),
        },
      ]}
    />
  );
};

export default IdPhotoResult;
