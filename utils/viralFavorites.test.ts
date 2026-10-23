/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearViralFavorites,
  clearViralRecent,
  FAVORITES_KEY,
  getViralFavorites,
  getViralRecent,
  pushViralRecent,
  RECENT_KEY,
  toggleViralFavorite,
  VIRAL_RECENT_MAX,
} from './viralFavorites';

function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  const memory = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
    writable: true,
  });
}

describe('viralFavorites', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    localStorage.clear();
  });

  it('toggles favorites in localStorage under bloom_ key', () => {
    expect(toggleViralFavorite('figurine-box')).toEqual(['figurine-box']);
    expect(getViralFavorites()).toEqual(['figurine-box']);
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toEqual(['figurine-box']);
    expect(toggleViralFavorite('figurine-box')).toEqual([]);
    clearViralFavorites();
    expect(getViralFavorites()).toEqual([]);
  });

  it('keeps recent list front-most and capped', () => {
    for (let i = 0; i < 10; i++) pushViralRecent(`id-${i}`);
    const recent = getViralRecent();
    expect(recent).toHaveLength(VIRAL_RECENT_MAX);
    expect(recent[0]).toBe('id-9');
    expect(localStorage.getItem(RECENT_KEY)).toBeTruthy();
    pushViralRecent('id-5');
    expect(getViralRecent()[0]).toBe('id-5');
    clearViralRecent();
    expect(getViralRecent()).toEqual([]);
  });
});
