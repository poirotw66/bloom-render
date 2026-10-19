/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Helpers for generation history `options`. Existing IndexedDB rows may omit
 * these fields; readers must treat them as optional (backward compatible).
 */

export type HistorySettingsSlice = {
  imageProvider?: string;
  provider?: string;
  model?: string;
};

/** Demo runs must not land in IndexedDB history. */
export function shouldPersistHistory(settings: HistorySettingsSlice): boolean {
  const provider = settings.imageProvider ?? settings.provider;
  return provider !== 'demo';
}

/**
 * Merge feature-specific options with provider/model metadata for later
 * "generate again" support. Does not strip unknown keys from `options`.
 */
export function buildHistoryOptions(
  feature: string,
  settings: HistorySettingsSlice,
  options: Record<string, unknown> = {},
): Record<string, unknown> {
  const provider = settings.imageProvider ?? settings.provider;
  const model = settings.model;

  return {
    ...options,
    feature,
    ...(provider !== undefined ? { provider } : {}),
    ...(model !== undefined ? { model } : {}),
    ...(provider === 'demo' ? { demo: true } : {}),
  };
}
