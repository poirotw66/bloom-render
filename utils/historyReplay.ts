/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Map history entries back to feature routes for "Generate again".
 */

import { ROUTES, type AppRoutePath } from '../constants/routes';

export const HISTORY_REPLAY_STATE_KEY = 'bloomHistoryReplay';

export type HistoryReplayState = {
  [HISTORY_REPLAY_STATE_KEY]: {
    type: string;
    options?: Record<string, unknown>;
    /** Object URL or data URL of the stored source image, when available. */
    sourceUrl?: string;
  };
};

export function routeForHistoryType(type: string): AppRoutePath {
  switch (type) {
    case 'generate':
      return ROUTES.HOME;
    case 'editor':
      return ROUTES.EDIT;
    case 'idphoto':
      return ROUTES.ID_PHOTO;
    case 'portrait':
      return ROUTES.PORTRAIT;
    case 'travel':
      return ROUTES.TRAVEL;
    case 'themed':
      return ROUTES.THEMED;
    case 'couple':
    case 'group':
      return ROUTES.COUPLE_GROUP;
    case 'tryon':
      return ROUTES.TRY_ON;
    default:
      return ROUTES.HOME;
  }
}

export function buildHistoryReplayState(
  type: string,
  options?: Record<string, unknown>,
  sourceUrl?: string,
): HistoryReplayState {
  return {
    [HISTORY_REPLAY_STATE_KEY]: { type, options, sourceUrl },
  };
}

export function readHistoryReplayState(
  state: unknown,
): HistoryReplayState[typeof HISTORY_REPLAY_STATE_KEY] | null {
  if (!state || typeof state !== 'object') return null;
  const payload = (state as HistoryReplayState)[HISTORY_REPLAY_STATE_KEY];
  if (!payload || typeof payload !== 'object' || typeof payload.type !== 'string') return null;
  return payload;
}
