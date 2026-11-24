/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { ROUTES } from '../constants/routes';
import {
  buildHistoryReplayState,
  HISTORY_REPLAY_STATE_KEY,
  readHistoryReplayState,
  routeForHistoryType,
} from './historyReplay';

describe('historyReplay', () => {
  it('maps history types to routes', () => {
    expect(routeForHistoryType('generate')).toBe(ROUTES.GENERATE);
    expect(routeForHistoryType('portrait')).toBe(ROUTES.PORTRAIT);
    expect(routeForHistoryType('couple')).toBe(ROUTES.COUPLE_GROUP);
    expect(routeForHistoryType('unknown')).toBe(ROUTES.HOME);
  });

  it('round-trips replay state', () => {
    const state = buildHistoryReplayState('travel', { sceneId: 'eiffel' }, 'blob:source');
    expect(readHistoryReplayState(state)).toEqual({
      type: 'travel',
      options: { sceneId: 'eiffel' },
      sourceUrl: 'blob:source',
    });
    expect(state[HISTORY_REPLAY_STATE_KEY].type).toBe('travel');
  });

  it('carries source and all reference blobs without relying on object URL lifetime', () => {
    const source = new Blob(['person']);
    const references = [
      { role: 'clothing' as const, blob: new Blob(['shirt']), name: 'shirt.png' },
    ];
    const state = buildHistoryReplayState('tryon', { quantity: 2 }, undefined, references, source);
    expect(readHistoryReplayState(state)?.references).toBe(references);
    expect(readHistoryReplayState(state)?.sourceBlob).toBe(source);
  });

  it('returns null for invalid state', () => {
    expect(readHistoryReplayState(null)).toBeNull();
    expect(readHistoryReplayState({})).toBeNull();
  });
});
