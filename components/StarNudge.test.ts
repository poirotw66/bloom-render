/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY_STAR_NUDGE_DISMISSED,
  dismissStarNudge,
  isStarNudgeDismissed,
} from './StarNudge';

describe('star nudge persistence', () => {
  it('is not dismissed by default', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    expect(isStarNudgeDismissed(storage)).toBe(false);
    dismissStarNudge(storage);
    expect(storage.getItem(STORAGE_KEY_STAR_NUDGE_DISMISSED)).toBe('1');
    expect(isStarNudgeDismissed(storage)).toBe(true);
  });
});
