/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { MODEL_LABEL_KEYS } from '../../constants/models';
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
  originalUrl?: string | null;
  idPhotoType: IdPhotoType;
  idPhotoRetouchLevel: RetouchLevel;
  idPhotoOutputSpec: OutputSpec;
  idPhotoClothingOption: ClothingOption;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const IdPhotoResult: React.FC<IdPhotoResultProps> = ({
  idPhotoResult,
  originalUrl,
  idPhotoType,
  idPhotoRetouchLevel,
  idPhotoOutputSpec,
  idPhotoClothingOption,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();
  const settings = useSettings();

  return (
    <GenericResult
      result={idPhotoResult}
      originalUrl={originalUrl}
      onAgain={onAgain}
      onEditInEditor={onEditInEditor}
      fileBaseName="id-photo"
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
          value: t(MODEL_LABEL_KEYS[settings.model]),
        },
      ]}
    />
  );
};

export default IdPhotoResult;
