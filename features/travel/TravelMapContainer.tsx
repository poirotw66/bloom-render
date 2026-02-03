/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TravelSceneCategory } from '../../constants/travel';
import WorldMap from './WorldMap';
import TaiwanMap from './TaiwanMap';
import { TRAVEL_SCENES_INTERNATIONAL, TRAVEL_SCENES_TAIWAN, TRAVEL_WEATHER_OPTIONS, TRAVEL_TIME_OPTIONS, TRAVEL_VIBE_OPTIONS, LOCATION_RECOMMENDED_VIBES, TravelWeather, TravelTimeOfDay, TravelVibe } from '../../constants/travel';

interface TravelMapContainerProps {
    selectedSceneId: string;
    onSceneSelect: (id: string) => void;
    weather: TravelWeather;
    setWeather: (w: TravelWeather) => void;
    timeOfDay: TravelTimeOfDay;
    setTimeOfDay: (t: TravelTimeOfDay) => void;
    vibe: TravelVibe | 'none';
    setVibe: (v: TravelVibe | 'none') => void;
}

type MapType = 'world' | 'taiwan';
type CategoryFilter = TravelSceneCategory | 'all';

const TravelMapContainer: React.FC<TravelMapContainerProps> = ({
    selectedSceneId, onSceneSelect,
    weather, setWeather,
    timeOfDay, setTimeOfDay,
    vibe, setVibe
}) => {
    const { t } = useLanguage();
    const [mapType, setMapType] = useState<MapType>('world');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('scenery');

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-2xl">
            {/* Header with toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-gray-300 tracking-wide uppercase">
                        {t('travel.map_mode_label')}
                    </label>
                    <p className="text-xs text-gray-500">
                        {t('travel.map_instruction')}
                    </p>
                </div>

                <div className="flex bg-gray-950/50 p-1 rounded-xl border border-gray-700/50 shadow-inner overflow-hidden">
                    <button
                        onClick={() => setMapType('world')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${mapType === 'world'
                            ? 'bg-gradient-to-br from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        🌍 {t('travel.map_world')}
                    </button>
                    <button
                        onClick={() => setMapType('taiwan')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${mapType === 'taiwan'
                            ? 'bg-gradient-to-br from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        🏝️ {t('travel.map_taiwan')}
                    </button>
                </div>
            </div>

            {/* Category Filter - For both Maps */}
            <div className="flex items-center justify-center -mt-2">
                <div className="flex bg-gray-900/40 p-1 rounded-lg border border-gray-700/30">
                    {(['scenery', 'food', 'all'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all duration-200 ${categoryFilter === cat
                                ? cat === 'food'
                                    ? 'bg-orange-600/80 text-white shadow-sm'
                                    : 'bg-indigo-600/80 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {cat === 'scenery' && '🏞️ '}
                            {cat === 'food' && '🍜 '}
                            {cat === 'all' && '✨ '}
                            {t(`travel.category.${cat}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map display - only render the active map */}
            <div className="min-h-[450px] flex items-center justify-center rounded-xl overflow-hidden bg-gray-950/20">
                {mapType === 'world' && (
                    <div className="w-full animate-fade-in">
                        <WorldMap
                            selectedSceneId={selectedSceneId}
                            onSceneSelect={onSceneSelect}
                            categoryFilter={categoryFilter}
                        />
                    </div>
                )}
                {mapType === 'taiwan' && (
                    <div className="w-full animate-fade-in">
                        <TaiwanMap
                            selectedSceneId={selectedSceneId}
                            onSceneSelect={onSceneSelect}
                            categoryFilter={categoryFilter}
                        />
                    </div>
                )}
            </div>

            {/* Selected location indicator with gourmet details */}
            {selectedSceneId && selectedSceneId !== 'custom' && selectedSceneId !== 'random' && (() => {
                const scene = [...TRAVEL_SCENES_INTERNATIONAL, ...TRAVEL_SCENES_TAIWAN].find(s => s.id === selectedSceneId);
                if (!scene) return null;

                const isFood = scene.category === 'food';
                const name = t(scene.nameKey) === scene.nameKey && selectedSceneId.startsWith('food_')
                    ? t(`travel.food.${selectedSceneId.replace('food_', '')}`)
                    : t(scene.nameKey);

                return (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <div className={`w-2 h-2 rounded-full ${isFood ? 'bg-orange-500' : 'bg-amber-500'} animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]`} />
                            <span className="text-sm font-medium text-amber-100/90">
                                {t('travel.result_scene_label')} <span className={`font-bold ${isFood ? 'text-orange-400' : 'text-amber-400'}`}>
                                    {name}
                                </span>
                            </span>
                        </div>

                        {/* Prompt Enhancements (Weather, Time, Vibe) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                            {/* Weather & Time */}
                            <div className="flex flex-col gap-3 bg-gray-900/40 p-4 rounded-xl border border-gray-700/30 backdrop-blur-sm">
                                <div className="flex flex-col gap-4">
                                    {/* Weather */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <span>{t('travel.label.weather')}</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {TRAVEL_WEATHER_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setWeather(opt.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border ${weather === opt.id
                                                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                            : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600'
                                                        }`}
                                                >
                                                    <span>{opt.icon}</span>
                                                    <span>{t(opt.nameKey)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <span>{t('travel.label.time')}</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {TRAVEL_TIME_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setTimeOfDay(opt.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border ${timeOfDay === opt.id
                                                            ? 'bg-amber-600/20 border-amber-500/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                                            : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600'
                                                        }`}
                                                >
                                                    <span>{opt.icon}</span>
                                                    <span>{t(opt.nameKey)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vibes */}
                            <div className="flex flex-col gap-3 bg-gray-900/40 p-4 rounded-xl border border-gray-700/30 backdrop-blur-sm">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {t('travel.label.vibe')}
                                        </label>
                                        <span className="text-[10px] text-gray-500 italic">{t('travel.label.vibe_desc')}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const recommendedIds = LOCATION_RECOMMENDED_VIBES[scene.id] || (isFood ? LOCATION_RECOMMENDED_VIBES['food'] : []);
                                            const otherIds = TRAVEL_VIBE_OPTIONS.map(v => v.id).filter(id => !recommendedIds.includes(id));
                                            const sortedVibes = [
                                                ...TRAVEL_VIBE_OPTIONS.filter(v => recommendedIds.includes(v.id)),
                                                ...TRAVEL_VIBE_OPTIONS.filter(v => otherIds.includes(v.id))
                                            ];

                                            return (
                                                <>
                                                    <button
                                                        onClick={() => setVibe('none')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border ${vibe === 'none'
                                                                ? 'bg-gray-600/20 border-gray-500/50 text-gray-200'
                                                                : 'bg-gray-800/40 border-gray-700/50 text-gray-400'
                                                            }`}
                                                    >
                                                        ✨ {t('common.none') || 'Default'}
                                                    </button>
                                                    {sortedVibes.map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setVibe(opt.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border ${vibe === opt.id
                                                                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(147,51,234,0.2)]'
                                                                    : recommendedIds.includes(opt.id)
                                                                        ? 'bg-indigo-900/20 border-indigo-700/30 text-indigo-300'
                                                                        : 'bg-gray-800/40 border-gray-700/50 text-gray-400'
                                                                }`}
                                                        >
                                                            <span>{opt.icon}</span>
                                                            <span>{t(opt.nameKey)}</span>
                                                            {recommendedIds.includes(opt.id) && <span className="w-1 h-1 rounded-full bg-indigo-400 ml-0.5" />}
                                                        </button>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gourmet Description Card */}
                        {isFood && scene.descriptionKey && (
                            <div className="animate-slide-up flex flex-col sm:flex-row gap-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl backdrop-blur-md">
                                {scene.referenceImagePath && (
                                    <div className="w-full sm:w-32 aspect-square rounded-lg overflow-hidden border border-orange-500/20 shadow-lg flex-shrink-0 bg-gray-900">
                                        <img
                                            src={scene.referenceImagePath}
                                            alt={name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🍜</span>
                                        <h4 className="font-bold text-orange-400">{name}</h4>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed italic">
                                        「{t(scene.descriptionKey)}」
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

export default TravelMapContainer;
