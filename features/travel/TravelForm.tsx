/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { TRAVEL_SCENES_INTERNATIONAL, TRAVEL_SCENES_TAIWAN, TRAVEL_SCENE_ID_RANDOM, TRAVEL_ASPECT_RATIOS, TRAVEL_IMAGE_SIZES } from '../../constants/travel';
import type { TravelAspectRatio, TravelImageSize } from '../../constants/travel';

const IS_PRO = (m: string) => m === 'gemini-3-pro-image-preview';

interface TravelFormProps {
  selectedSceneId: string;
  setSelectedSceneId: (v: string) => void;
  customSceneText: string;
  setCustomSceneText: (v: string) => void;
  customSceneReferenceFile: File | null;
  customSceneReferenceUrl: string | null;
  setCustomSceneReferenceFile: (v: File | null) => void;
  aspectRatio: TravelAspectRatio;
  setAspectRatio: (v: TravelAspectRatio) => void;
  imageSize: TravelImageSize;
  setImageSize: (v: TravelImageSize) => void;
  disabled?: boolean;
}

const SCENE_BTN = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
const SCENE_ACTIVE = 'bg-amber-600 text-white border border-amber-500';
const SCENE_INACTIVE = 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500';

const TravelForm: React.FC<TravelFormProps> = ({
  selectedSceneId,
  setSelectedSceneId,
  customSceneText,
  setCustomSceneText,
  customSceneReferenceFile,
  customSceneReferenceUrl,
  setCustomSceneReferenceFile,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const { model } = useSettings();
  const imageSizeOptions = IS_PRO(model) ? TRAVEL_IMAGE_SIZES : TRAVEL_IMAGE_SIZES.filter((s) => !s.proOnly);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.image_size')}</label>
        <p className="text-xs text-gray-500 mb-2">{t('travel.size_hint')}</p>
        <div className="flex flex-wrap gap-2">
          {imageSizeOptions.map((a) => (
            <button
              key={a.id}
              onClick={() => setImageSize(a.id)}
              disabled={disabled}
              className={`${SCENE_BTN} ${imageSize === a.id ? SCENE_ACTIVE : SCENE_INACTIVE}`}
            >
              {t(a.nameKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.aspect_ratio')}</label>
        <div className="flex flex-wrap gap-2">
          {TRAVEL_ASPECT_RATIOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAspectRatio(a.id)}
              disabled={disabled}
              className={`${SCENE_BTN} ${aspectRatio === a.id ? SCENE_ACTIVE : SCENE_INACTIVE}`}
            >
              {t(a.nameKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.scene')}</label>
        <p className="text-xs text-gray-500 mb-2">{t('travel.scene_hint')}</p>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-2">{t('travel.group.international')}</h4>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_SCENES_INTERNATIONAL.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSceneId(s.id)}
                  disabled={disabled}
                  className={`${SCENE_BTN} ${selectedSceneId === s.id ? SCENE_ACTIVE : SCENE_INACTIVE}`}
                >
                  {t(s.nameKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-2">{t('travel.group.taiwan')}</h4>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_SCENES_TAIWAN.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSceneId(s.id)}
                  disabled={disabled}
                  className={`${SCENE_BTN} ${selectedSceneId === s.id ? SCENE_ACTIVE : SCENE_INACTIVE}`}
                >
                  {t(s.nameKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-2">{t('travel.group.random')}</h4>
            <button
              onClick={() => setSelectedSceneId(TRAVEL_SCENE_ID_RANDOM)}
              disabled={disabled}
              className={`mb-2 ${SCENE_BTN} ${selectedSceneId === TRAVEL_SCENE_ID_RANDOM ? SCENE_ACTIVE : SCENE_INACTIVE}`}
            >
              {t('travel.random_btn')}
            </button>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('travel.custom')}</h4>
            <button
              onClick={() => setSelectedSceneId('custom')}
              disabled={disabled}
              className={`mb-2 ${SCENE_BTN} ${selectedSceneId === 'custom' ? SCENE_ACTIVE : SCENE_INACTIVE}`}
            >
              {t('travel.custom_btn')}
            </button>
            {selectedSceneId === 'custom' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customSceneText}
                  onChange={(e) => setCustomSceneText(e.target.value)}
                  placeholder={t('travel.custom_placeholder')}
                  disabled={disabled}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('travel.custom_reference_label')}</label>
                  {customSceneReferenceFile ? (
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex-shrink-0">
                        {customSceneReferenceUrl && (
                          <img src={customSceneReferenceUrl} alt="Scene reference" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomSceneReferenceFile(null)}
                        disabled={disabled}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {t('travel.custom_reference_remove')}
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={disabled}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCustomSceneReferenceFile(f); e.target.value = ''; }}
                      />
                      {t('travel.custom_reference_btn')}
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelForm;
