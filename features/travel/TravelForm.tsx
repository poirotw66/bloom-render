/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { TRAVEL_SCENES_INTERNATIONAL, TRAVEL_SCENES_TAIWAN, TRAVEL_SCENE_ID_RANDOM, TRAVEL_ASPECT_RATIOS, TRAVEL_IMAGE_SIZES, TRAVEL_STYLES, TRAVEL_WEATHER_OPTIONS, TRAVEL_TIME_OPTIONS, TRAVEL_VIBE_OPTIONS } from '../../constants/travel';
import type { TravelAspectRatio, TravelImageSize, TravelStyle, TravelWeather, TravelTimeOfDay, TravelVibe } from '../../constants/travel';

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
  style: TravelStyle;
  setStyle: (v: TravelStyle) => void;
  weather: TravelWeather;
  setWeather: (v: TravelWeather) => void;
  timeOfDay: TravelTimeOfDay;
  setTimeOfDay: (v: TravelTimeOfDay) => void;
  vibe: TravelVibe | 'none';
  setVibe: (v: TravelVibe | 'none') => void;
  useReferenceImage: boolean;
  setUseReferenceImage: (v: boolean) => void;
  disabled?: boolean;
  showSceneSelector?: boolean;
}

const SCENE_BTN = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
const SCENE_ACTIVE = 'bg-amber-600 text-white border border-amber-500';
const SCENE_INACTIVE = 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; icon?: string }> = ({ title, children, icon }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-900/20">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-gray-300 hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4 animate-slide-down">{children}</div>}
    </div>
  );
};

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
  style,
  setStyle,
  weather,
  setWeather,
  timeOfDay,
  setTimeOfDay,
  vibe,
  setVibe,
  useReferenceImage,
  setUseReferenceImage,
  disabled = false,
  showSceneSelector = true,
}) => {
  const { t } = useLanguage();
  const { model } = useSettings();
  const imageSizeOptions = IS_PRO(model) ? TRAVEL_IMAGE_SIZES : TRAVEL_IMAGE_SIZES.filter((s) => !s.proOnly);

  return (
    <div className={`flex flex-col gap-4 w-full animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm ${showSceneSelector ? 'max-w-2xl' : 'max-w-full'}`}>
      <div className="flex flex-wrap gap-8 items-start">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.image_size')}</label>
          {!showSceneSelector && <p className="text-xs text-gray-500 mb-2">{t('travel.size_hint')}</p>}
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
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.style')}</label>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                disabled={disabled}
                className={`${SCENE_BTN} ${style === s.id ? SCENE_ACTIVE : SCENE_INACTIVE}`}
              >
                {t(s.nameKey)}
              </button>
            ))}
          </div>
        </div>

        {showSceneSelector && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.weather')}</label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_WEATHER_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWeather(w.id)}
                    disabled={disabled}
                    className={`${SCENE_BTN} ${weather === w.id ? 'bg-blue-600 text-white border border-blue-500' : SCENE_INACTIVE}`}
                  >
                    <span className="mr-2">{w.icon}</span>
                    {t(w.nameKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.time')}</label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_TIME_OPTIONS.map((tod) => (
                  <button
                    key={tod.id}
                    onClick={() => setTimeOfDay(tod.id)}
                    disabled={disabled}
                    className={`${SCENE_BTN} ${timeOfDay === tod.id ? 'bg-amber-600 text-white border border-amber-500' : SCENE_INACTIVE}`}
                  >
                    <span className="mr-2">{tod.icon}</span>
                    {t(tod.nameKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.vibe')}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setVibe('none')}
                  disabled={disabled}
                  className={`${SCENE_BTN} ${vibe === 'none' ? 'bg-indigo-600 text-white border border-indigo-500' : SCENE_INACTIVE}`}
                >
                  ✨ {t('common.none') || 'Default'}
                </button>
                {TRAVEL_VIBE_OPTIONS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    disabled={disabled}
                    className={`${SCENE_BTN} ${vibe === v.id ? 'bg-purple-600 text-white border border-purple-500' : SCENE_INACTIVE}`}
                  >
                    <span className="mr-2">{v.icon}</span>
                    {t(v.nameKey)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700/50">
        <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.ref_image')}</label>

        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setUseReferenceImage(!useReferenceImage)}
            disabled={disabled}
            className={`px-3 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-colors ${useReferenceImage ? 'bg-indigo-600 text-white border border-indigo-500' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}
          >
            <span className={`w-2 h-2 rounded-full ${useReferenceImage ? 'bg-white' : 'bg-gray-500'}`}></span>
            {useReferenceImage ? t('travel.ref_image.on') : t('travel.ref_image.off')}
          </button>
          <span className="text-[10px] text-gray-500">{t('travel.ref_image.hint')}</span>
        </div>

        {useReferenceImage && (
          <div className="mt-2 animate-fade-in">
            {customSceneReferenceFile ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded border border-gray-600 bg-gray-900 overflow-hidden flex-shrink-0">
                  {customSceneReferenceUrl && (
                    <img src={customSceneReferenceUrl} alt="Ref" className="w-full h-full object-cover" />
                  )}
                </div>
                <button
                  onClick={() => setCustomSceneReferenceFile(null)}
                  disabled={disabled}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  ✕ {t('travel.ref_image.remove')}
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center px-3 py-2 border border-dashed border-gray-600 rounded text-xs text-gray-400 cursor-pointer hover:bg-gray-800/50 hover:text-gray-200 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={disabled}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setCustomSceneReferenceFile(f); e.target.value = ''; }}
                />
                + {t('travel.ref_image.upload')}
              </label>
            )}
          </div>
        )}
      </div>
      {showSceneSelector && (
        <div>
          <div className="mb-4 pt-4 border-t border-gray-700/50"></div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('travel.label.scene')}</label>
          <p className="text-xs text-gray-500 mb-2">{t('travel.scene_hint')}</p>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-2">{t('travel.group.international')}</h4>

              <div className="space-y-2">
                {/* International Scenery Section */}
                <CollapsibleSection title={t('travel.category.scenery')} icon="🏞️">
                  <div className="space-y-4 pt-2">
                    {(['europe', 'asia', 'namerica', 'samerica', 'oceania', 'africa'] as const).map(continent => {
                      const continentScenes = TRAVEL_SCENES_INTERNATIONAL.filter(s => s.category === 'scenery' && s.continent === continent);
                      if (continentScenes.length === 0) return null;
                      return (
                        <div key={`intl-scenery-${continent}`}>
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 px-1">{t(`travel.continent.${continent}`)}</h5>
                          <div className="flex flex-wrap gap-2">
                            {continentScenes.map((s) => (
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
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* International Gourmet Section */}
                <CollapsibleSection title={t('travel.category.food')} icon="🍜">
                  <div className="space-y-4 pt-2">
                    {(['europe', 'asia', 'namerica', 'samerica', 'oceania', 'africa'] as const).map(continent => {
                      const continentScenes = TRAVEL_SCENES_INTERNATIONAL.filter(s => s.category === 'food' && s.continent === continent);
                      if (continentScenes.length === 0) return null;
                      return (
                        <div key={`intl-food-${continent}`}>
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 px-1">{t(`travel.continent.${continent}`)}</h5>
                          <div className="flex flex-wrap gap-2">
                            {continentScenes.map((s) => (
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
                      );
                    })}
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-2">{t('travel.group.taiwan')}</h4>

              <div className="space-y-2">
                {/* Taiwan Scenery Section */}
                <CollapsibleSection title={t('travel.category.scenery')} icon="🏞️">
                  <div className="space-y-4 pt-2">
                    {(['north', 'central', 'south', 'east', 'islands'] as const).map(region => {
                      const regionalScenes = TRAVEL_SCENES_TAIWAN.filter(s => s.category === 'scenery' && s.region === region);
                      if (regionalScenes.length === 0) return null;
                      return (
                        <div key={`scenery-${region}`}>
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 px-1">{t(`travel.region.${region}`)}</h5>
                          <div className="flex flex-wrap gap-2">
                            {regionalScenes.map((s) => (
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
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* Taiwan Gourmet Section */}
                <CollapsibleSection title={t('travel.category.food')} icon="🍜">
                  <div className="space-y-4 pt-2">
                    {(['north', 'central', 'south', 'east', 'islands'] as const).map(region => {
                      const regionalScenes = TRAVEL_SCENES_TAIWAN.filter(s => s.category === 'food' && s.region === region);
                      if (regionalScenes.length === 0) return null;
                      return (
                        <div key={`food-${region}`}>
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 px-1">{t(`travel.region.${region}`)}</h5>
                          <div className="flex flex-wrap gap-2">
                            {regionalScenes.map((s) => (
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
                      );
                    })}
                  </div>
                </CollapsibleSection>
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
      )
      }
    </div >
  );
};

export default TravelForm;
