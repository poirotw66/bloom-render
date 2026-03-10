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
    <div className="flex flex-col gap-4 w-full max-w-2xl animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {t('idphoto.label.type')}
        </label>
        <select
          value={idPhotoType}
          onChange={(e) => setIdPhotoType(e.target.value as IdPhotoType)}
          disabled={disabled}
          className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ID_PHOTO_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {t(type.nameKey)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {t('idphoto.label.level')}
        </label>
        <div className="flex flex-wrap gap-2">
          {RETOUCH_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setIdPhotoRetouchLevel(level.id)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                idPhotoRetouchLevel === level.id
                  ? 'bg-emerald-600 text-white border border-emerald-500'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t(level.nameKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {t('idphoto.label.spec')}
        </label>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_SPECS.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setIdPhotoOutputSpec(spec.id)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                idPhotoOutputSpec === spec.id
                  ? 'bg-emerald-600 text-white border border-emerald-500'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t(spec.nameKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {t('idphoto.label.clothing')}
        </label>
        <select
          value={idPhotoClothingOption}
          onChange={(e) => setIdPhotoClothingOption(e.target.value as ClothingOption)}
          disabled={disabled}
          className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('idphoto.clothing.custom_image_label')}
              </label>
              {idPhotoClothingReferenceFile ? (
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex-shrink-0">
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
                <label className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
