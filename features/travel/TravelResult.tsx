/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  DownloadIcon,
  EditIcon,
  RefreshIcon,
  SparklesIcon,
  TravelIcon,
  UsersIcon,
} from '../../components/icons';
import { TRAVEL_PANEL } from './travelUi';

import {
  TRAVEL_OUTFIT_OPTIONS,
  TRAVEL_POSE_OPTIONS,
  TRAVEL_WEATHER_OPTIONS,
  TRAVEL_TIME_OPTIONS,
  TRAVEL_STYLES,
  TRAVEL_RELATIONSHIP_OPTIONS,
  TravelOutfit,
  TravelPose,
  TravelWeather,
  TravelTimeOfDay,
  TravelVibe,
  TravelStyle,
  TravelRelationship,
  TravelFraming,
} from '../../constants/travel';

interface TravelResultProps {
  result: string;
  resultSceneNameKey: string | null;
  resultSceneCustomLabel: string | null;
  resultMetadata: {
    outfit: TravelOutfit;
    outfitColor: string;
    customOutfitText?: string;
    pose: TravelPose;
    customPoseText?: string;
    relationship: TravelRelationship;
    weather: TravelWeather;
    time: TravelTimeOfDay;
    vibe: TravelVibe | 'none';
    style: TravelStyle;
    framing: TravelFraming;
    clearBackground: boolean;
  } | null;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor: (result: string, index?: number) => void;
}

const TravelResult: React.FC<TravelResultProps> = ({
  result,
  resultSceneNameKey,
  resultSceneCustomLabel,
  resultMetadata,
  onDownload,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();
  const sceneLabel = resultSceneNameKey
    ? t(resultSceneNameKey)
    : resultSceneCustomLabel || t('travel.custom_btn');

  const m = resultMetadata;

  return (
    <div
      className={`flex flex-col items-center gap-6 w-full max-w-2xl motion-safe:animate-fade-in p-6 ${TRAVEL_PANEL}`}
    >
      <div className="text-center w-full">
        <h3 className="text-xl font-bold text-white">{t('travel.title')}</h3>
      </div>
      <div className="w-full aspect-[4/3] max-h-[400px] rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex items-center justify-center shadow-2xl">
        <img
          src={result}
          alt="Travel photo"
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>

      {m && (
        <div className="w-full bg-black/20 rounded-2xl p-5 border border-white/5 space-y-6">
          {/* Top Row: Scene Information */}
          <div className="flex items-start gap-4 border-b border-gray-700/30 pb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-inner shrink-0">
              <TravelIcon className="w-5 h-5 text-sky-300" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                {t('travel.label.scene')}
              </h4>
              <div className="text-base font-bold text-amber-400 tracking-tight leading-tight">
                {sceneLabel}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
            {/* Subject & Pose Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {t('travel.label.group_subject')} & {t('travel.label.pose')}
                </h4>
              </div>
              <div className="space-y-2.5 ml-3">
                <div className="flex items-center gap-3 text-base text-gray-200 group">
                  <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-xs group-hover:bg-white/10 transition-colors">
                    👗
                  </span>
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {t('travel.label.outfit')}
                  </span>
                  <span className="font-medium">
                    {m.customOutfitText ||
                      t(TRAVEL_OUTFIT_OPTIONS.find((o) => o.id === m.outfit)?.nameKey || '')}
                    {m.outfitColor && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] text-gray-400 font-normal">
                        {m.outfitColor}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-base text-gray-200 group">
                  <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-xs group-hover:bg-white/10 transition-colors">
                    🧘
                  </span>
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {t('travel.label.pose')}
                  </span>
                  <span className="font-medium">
                    {m.customPoseText ||
                      t(TRAVEL_POSE_OPTIONS.find((p) => p.id === m.pose)?.nameKey || '')}
                  </span>
                </div>
                {m.relationship !== 'default' && (
                  <div className="flex items-center gap-3 text-base text-gray-200 group">
                    <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-xs group-hover:bg-white/10 transition-colors">
                      <UsersIcon className="w-4 h-4" />
                    </span>
                    <span className="text-gray-500 text-xs min-w-[60px]">
                      {t('travel.label.relationship')}
                    </span>
                    <span className="font-medium">
                      {t(
                        TRAVEL_RELATIONSHIP_OPTIONS.find((r) => r.id === m.relationship)?.nameKey ||
                          '',
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Environment & Style Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-teal-500 rounded-full" />
                <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                  {t('travel.label.group_environment')} & {t('travel.label.group_aesthetics')}
                </h4>
              </div>
              <div className="space-y-2.5 ml-3">
                <div className="flex items-center gap-3 text-base text-gray-200 group">
                  <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-xs group-hover:bg-white/10 transition-colors">
                    {TRAVEL_WEATHER_OPTIONS.find((w) => w.id === m.weather)?.icon || '☁️'}
                  </span>
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {t('travel.label.weather')}
                  </span>
                  <span className="font-medium">
                    {t(TRAVEL_WEATHER_OPTIONS.find((w) => w.id === m.weather)?.nameKey || '')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-base text-gray-200 group">
                  <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-xs group-hover:bg-white/10 transition-colors">
                    {TRAVEL_TIME_OPTIONS.find((t_) => t_.id === m.time)?.icon || '🕒'}
                  </span>
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {t('travel.label.time')}
                  </span>
                  <span className="font-medium">
                    {t(TRAVEL_TIME_OPTIONS.find((t_) => t_.id === m.time)?.nameKey || '')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-base text-gray-200 group">
                  <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-xs group-hover:bg-white/10 transition-colors">
                    🎨
                  </span>
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {t('travel.label.style')}
                  </span>
                  <span className="font-medium">
                    {t(TRAVEL_STYLES.find((s) => s.id === m.style)?.nameKey || '')}
                  </span>
                </div>
                {m.clearBackground && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-widest w-fit">
                      <SparklesIcon className="w-3 h-3" />
                      <span>{t('travel.label.clear_background')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 w-full border-t border-gray-700/50 pt-6">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white font-bold py-3 px-5 rounded-xl transition-colors duration-200 shadow-md shadow-emerald-500/20 hover:from-emerald-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <DownloadIcon className="w-5 h-5" />
          {t('travel.download')}
        </button>
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-slate-200 font-semibold py-3 px-5 rounded-xl transition-colors duration-200 hover:bg-white/15 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <RefreshIcon className="w-5 h-5" />
          {t('travel.again')}
        </button>
        <button
          type="button"
          onClick={() => onEditInEditor(result)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-5 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <EditIcon className="w-5 h-5" />
          {t('travel.edit_in_editor')}
        </button>
      </div>
    </div>
  );
};

export default TravelResult;
