/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Normalize transformers.js hub progress events into a 0–100 percentage
 * and a short status label key for the UI.
 */

/** Subset of transformers.js ProgressInfo we care about (avoids importing the package in tests). */
export type HubProgressEvent = {
  status: string;
  progress?: number;
  loaded?: number;
  total?: number;
  file?: string;
  name?: string;
  task?: string;
  model?: string;
};

export type LocalEnhanceProgress = {
  /** 0–100, clamped. */
  percent: number;
  /** Stable i18n key under `enhance.*`. */
  statusKey: string;
  /** Optional file name currently downloading. */
  file?: string;
};

/**
 * Map a single hub progress event to UI state.
 * Download `progress` from transformers.js is already 0–100 when present.
 */
export function normalizeHubProgress(event: HubProgressEvent): LocalEnhanceProgress {
  const file = typeof event.file === 'string' ? event.file : undefined;

  switch (event.status) {
    case 'initiate':
      return { percent: 0, statusKey: 'enhance.status_initiate', file };
    case 'download':
      return { percent: 0, statusKey: 'enhance.status_download', file };
    case 'progress': {
      let percent = 0;
      if (typeof event.progress === 'number' && Number.isFinite(event.progress)) {
        percent = event.progress;
      } else if (
        typeof event.loaded === 'number' &&
        typeof event.total === 'number' &&
        event.total > 0
      ) {
        percent = (event.loaded / event.total) * 100;
      }
      return {
        percent: clampPercent(percent),
        statusKey: 'enhance.status_download',
        file,
      };
    }
    case 'done':
      return { percent: 100, statusKey: 'enhance.status_ready', file };
    case 'ready':
      return { percent: 100, statusKey: 'enhance.status_ready', file };
    default:
      return { percent: 0, statusKey: 'enhance.status_running', file };
  }
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Prefer the latest per-file progress when several ONNX shards download in parallel.
 * `fileProgress` maps file → 0–100; overall is the mean of known files (or 0).
 */
export function aggregateFileProgress(fileProgress: Record<string, number>): number {
  const values = Object.values(fileProgress);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + clampPercent(v), 0);
  return clampPercent(sum / values.length);
}
