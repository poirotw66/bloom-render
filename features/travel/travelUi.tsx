/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { ListBulletIcon, MapIcon, SparklesIcon, TravelIcon } from '../../components/icons';

export const TRAVEL_PANEL = 'rounded-2xl border theme-border theme-raised';

export const TRAVEL_CHIP =
  'px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] disabled:opacity-50 disabled:cursor-not-allowed border flex items-center justify-center gap-2';

export const TRAVEL_CHIP_ACTIVE = 'brand-bg text-white theme-border-strong';

export const TRAVEL_CHIP_INACTIVE =
  'theme-raised theme-ink-muted theme-border hover:opacity-90 hover:theme-ink-soft';

export const TRAVEL_SEGMENT_TRACK = 'inline-flex p-1 rounded-xl border theme-border theme-raised';

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
  const pad = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';
  const icon = 'w-4 h-4';

  const active = 'brand-bg text-white';
  const idle = 'theme-ink-muted hover:theme-ink-soft hover:opacity-90';

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
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl brand-bg-tint border theme-border text-sm font-semibold brand-text max-w-full">
          <TravelIcon className="w-4 h-4 shrink-0 brand-text" aria-hidden />
          <span className="truncate">{sceneLabel}</span>
        </span>
        <span className="text-sm theme-ink-muted leading-snug">{instruction}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <TravelViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          mapLabel={mapLabel}
          listLabel={listLabel}
        />
        {surpriseHint && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl brand-bg-tint border theme-border brand-text text-sm font-semibold">
            <SparklesIcon className="w-3.5 h-3.5" />
            {surpriseHint}
          </span>
        )}
      </div>
    </div>
  </div>
);
