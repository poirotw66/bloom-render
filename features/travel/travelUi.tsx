/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ListBulletIcon, MapIcon, SparklesIcon, TravelIcon } from '../../components/icons';

export const TRAVEL_PANEL =
  'rounded-2xl border border-sky-500/15 bg-gradient-to-b from-slate-900/70 via-slate-950/80 to-black/60 shadow-xl shadow-sky-950/40 backdrop-blur-xl';

export const TRAVEL_CHIP =
  'px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed border flex items-center justify-center gap-2';

export const TRAVEL_CHIP_ACTIVE =
  'bg-sky-600 text-white border-sky-400/60 shadow-md shadow-sky-600/25';

export const TRAVEL_CHIP_INACTIVE =
  'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-700/50 hover:border-slate-600 hover:text-slate-200';

export const TRAVEL_SEGMENT_TRACK =
  'inline-flex p-1 rounded-xl border border-slate-700/80 bg-slate-950/80 shadow-inner';

type ViewMode = 'list' | 'map';

interface TravelViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  mapLabel: string;
  listLabel: string;
  size?: 'sm' | 'md';
}

export const TravelViewModeToggle: React.FC<TravelViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  mapLabel,
  listLabel,
  size = 'md',
}) => {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const icon = 'w-4 h-4';

  const active =
    'bg-gradient-to-br from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/30';
  const idle = 'text-slate-400 hover:text-slate-200 hover:bg-white/5';

  return (
    <div className={TRAVEL_SEGMENT_TRACK} role="group" aria-label={mapLabel}>
      <button
        type="button"
        onClick={() => onViewModeChange('map')}
        className={`${pad} font-bold rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer ${viewMode === 'map' ? active : idle}`}
        aria-pressed={viewMode === 'map'}
      >
        <MapIcon className={icon} />
        <span>{mapLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        className={`${pad} font-bold rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer ${viewMode === 'list' ? active : idle}`}
        aria-pressed={viewMode === 'list'}
      >
        <ListBulletIcon className={icon} />
        <span>{listLabel}</span>
      </button>
    </div>
  );
};

interface TravelToolbarProps {
  sceneLabel: string;
  instruction: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  mapLabel: string;
  listLabel: string;
  surpriseHint?: string;
}

export const TravelToolbar: React.FC<TravelToolbarProps> = ({
  sceneLabel,
  instruction,
  viewMode,
  onViewModeChange,
  mapLabel,
  listLabel,
  surpriseHint,
}) => (
  <div className={`w-full flex flex-col gap-3 p-4 ${TRAVEL_PANEL}`}>
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sm font-semibold text-sky-100 max-w-full">
          <TravelIcon className="w-4 h-4 shrink-0 text-sky-300" aria-hidden />
          <span className="truncate">{sceneLabel}</span>
        </span>
        <span className="text-sm text-slate-400 leading-snug">{instruction}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <TravelViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          mapLabel={mapLabel}
          listLabel={listLabel}
        />
        {surpriseHint && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-100 text-xs font-semibold">
            <SparklesIcon className="w-3.5 h-3.5" />
            {surpriseHint}
          </span>
        )}
      </div>
    </div>
  </div>
);
