/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Retouch selection mode (point vs brush) and brush controls.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from '../utils/maskBrush';
import type { MaskBrushTool } from '../utils/maskBrush';

export type RetouchSelectMode = 'point' | 'brush';

interface RetouchMaskToolbarProps {
  mode: RetouchSelectMode;
  onModeChange: (mode: RetouchSelectMode) => void;
  tool: MaskBrushTool;
  onToolChange: (tool: MaskBrushTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  canUndoStroke: boolean;
  onUndoStroke: () => void;
  hasMask: boolean;
  onClearMask: () => void;
  disabled?: boolean;
}

const RetouchMaskToolbar: React.FC<RetouchMaskToolbarProps> = ({
  mode,
  onModeChange,
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  canUndoStroke,
  onUndoStroke,
  hasMask,
  onClearMask,
  disabled = false,
}) => {
  const { t } = useLanguage();

  const modeBtn = (value: RetouchSelectMode, label: string) => (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={mode === value}
      onClick={() => onModeChange(value)}
      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${
        mode === value
          ? 'bg-white/20 text-white'
          : 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  const toolBtn = (value: MaskBrushTool, label: string) => (
    <button
      type="button"
      disabled={disabled || mode !== 'brush'}
      aria-pressed={tool === value}
      onClick={() => onToolChange(value)}
      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${
        tool === value && mode === 'brush'
          ? 'bg-sky-500/80 text-white'
          : 'bg-white/10 text-gray-200 hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t('main.retouch_mode_label')}
      >
        {modeBtn('point', t('main.retouch_mode_point'))}
        {modeBtn('brush', t('main.retouch_mode_brush'))}
      </div>

      {mode === 'brush' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label={t('main.retouch_brush_tool_label')}
          >
            {toolBtn('paint', t('main.retouch_brush_paint'))}
            {toolBtn('erase', t('main.retouch_brush_erase'))}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 min-w-[12rem] flex-1">
            <span className="whitespace-nowrap">{t('main.retouch_brush_size')}</span>
            <input
              type="range"
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              value={brushSize}
              disabled={disabled}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer disabled:cursor-not-allowed"
              aria-valuemin={MIN_BRUSH_SIZE}
              aria-valuemax={MAX_BRUSH_SIZE}
              aria-valuenow={brushSize}
            />
            <span className="tabular-nums w-8 text-right text-gray-400">{brushSize}</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || !canUndoStroke}
              onClick={onUndoStroke}
              className="px-3 py-1.5 rounded-md text-sm font-semibold bg-white/10 text-gray-200 hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('main.retouch_brush_undo_stroke')}
            </button>
            <button
              type="button"
              disabled={disabled || !hasMask}
              onClick={onClearMask}
              className="px-3 py-1.5 rounded-md text-sm font-semibold bg-white/10 text-gray-200 hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('main.retouch_brush_clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetouchMaskToolbar;
