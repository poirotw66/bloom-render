/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
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
import {
  UI_FILE_PICKER,
  UI_FORM_CARD,
  UI_INPUT,
  UI_LABEL,
  UI_LABEL_HINT,
  UI_SELECT,
  uiOption,
} from '../../utils/uiClasses';

interface IdPhotoFormProps {
  idPhotoType: IdPhotoType;
  setIdPhotoType: (v: IdPhotoType) => void;
  idPhotoRetouchLevel: RetouchLevel;
  setIdPhotoRetouchLevel: (v: RetouchLevel) => void;
  idPhotoOutputSpec: OutputSpec;
  setIdPhotoOutputSpec: (v: OutputSpec) => void;
  idPhotoClothingOption: ClothingOption;
  setIdPhotoClothingOption: (v: ClothingOption) => void;
  idPhotoClothingCustomText: string;
  setIdPhotoClothingCustomText: (v: string) => void;
  idPhotoClothingReferenceFile: File | null;
  setIdPhotoClothingReferenceFile: (v: File | null) => void;
  idPhotoClothingReferenceUrl: string | null;
  disabled?: boolean;
}

const IdPhotoForm: React.FC<IdPhotoFormProps> = ({
  idPhotoType,
  setIdPhotoType,
  idPhotoRetouchLevel,
  setIdPhotoRetouchLevel,
  idPhotoOutputSpec,
  setIdPhotoOutputSpec,
  idPhotoClothingOption,
  setIdPhotoClothingOption,
  idPhotoClothingCustomText,
  setIdPhotoClothingCustomText,
  idPhotoClothingReferenceFile,
  setIdPhotoClothingReferenceFile,
  idPhotoClothingReferenceUrl,
  disabled = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className={UI_FORM_CARD}>
      <div>
        <label className={UI_LABEL}>{t('idphoto.label.type')}</label>
        <select
          value={idPhotoType}
          onChange={(e) => setIdPhotoType(e.target.value as IdPhotoType)}
          disabled={disabled}
          className={UI_SELECT}
        >
          {ID_PHOTO_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {t(type.nameKey)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={UI_LABEL}>{t('idphoto.label.level')}</label>
        <div className="flex flex-wrap gap-2">
          {RETOUCH_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => setIdPhotoRetouchLevel(level.id)}
              disabled={disabled}
              className={uiOption(idPhotoRetouchLevel === level.id)}
            >
              {t(level.nameKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={UI_LABEL}>{t('idphoto.label.spec')}</label>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_SPECS.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => setIdPhotoOutputSpec(spec.id)}
              disabled={disabled}
              className={uiOption(idPhotoOutputSpec === spec.id)}
            >
              {t(spec.nameKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={UI_LABEL}>{t('idphoto.label.clothing')}</label>
        <select
          value={idPhotoClothingOption}
          onChange={(e) => setIdPhotoClothingOption(e.target.value as ClothingOption)}
          disabled={disabled}
          className={UI_SELECT}
        >
          {CLOTHING_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.nameKey)}
            </option>
          ))}
        </select>
        {idPhotoClothingOption === 'custom' && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={idPhotoClothingCustomText}
              onChange={(e) => setIdPhotoClothingCustomText(e.target.value)}
              placeholder={t('idphoto.clothing.custom_placeholder')}
              disabled={disabled}
              className={UI_INPUT}
            />
            <div>
              <label className={UI_LABEL_HINT}>{t('idphoto.clothing.custom_image_label')}</label>
              {idPhotoClothingReferenceFile ? (
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-600 bg-gray-900 flex-shrink-0">
                    {idPhotoClothingReferenceUrl && (
                      <img
                        src={idPhotoClothingReferenceUrl}
                        alt="Clothing reference"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIdPhotoClothingReferenceFile(null)}
                    disabled={disabled}
                    className="text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {t('idphoto.clothing.custom_image_remove')}
                  </button>
                </div>
              ) : (
                <label className={UI_FILE_PICKER}>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={disabled}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setIdPhotoClothingReferenceFile(f);
                      e.target.value = '';
                    }}
                  />
                  {t('idphoto.clothing.custom_image_btn')}
                </label>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">{t('idphoto.model_recommendation')}</p>
    </div>
  );
};

export default IdPhotoForm;
