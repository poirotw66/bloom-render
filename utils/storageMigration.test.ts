/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migratePixshopToBloomKeys, STORAGE_KEY_MIGRATIONS } from './storageMigration';

describe('migratePixshopToBloomKeys', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('moves localStorage prefs from pixshop_ to bloom_', () => {
    localStorage.setItem('pixshop_theme', 'night');
    localStorage.setItem('pixshop_language', 'zh-TW');
    localStorage.setItem('pixshop_model', 'gemini-3.1-flash-lite-image');
    const result = migratePixshopToBloomKeys();
    expect(result.localMoved).toBe(3);
    expect(localStorage.getItem('bloom_theme')).toBe('night');
    expect(localStorage.getItem('bloom_language')).toBe('zh-TW');
    expect(localStorage.getItem('bloom_model')).toBe('gemini-3.1-flash-lite-image');
    expect(localStorage.getItem('pixshop_theme')).toBeNull();
    expect(localStorage.getItem('pixshop_language')).toBeNull();
    expect(localStorage.getItem('pixshop_model')).toBeNull();
  });

  it('moves sessionStorage secrets and oauth state', () => {
    sessionStorage.setItem('pixshop_api_key', 'AIza-legacy');
    sessionStorage.setItem('pixshop_or_oauth_state', 'state');
    migratePixshopToBloomKeys();
    expect(sessionStorage.getItem('bloom_api_key')).toBe('AIza-legacy');
    expect(sessionStorage.getItem('bloom_or_oauth_state')).toBe('state');
    expect(sessionStorage.getItem('pixshop_api_key')).toBeNull();
  });

  it('prefers an existing bloom_ value and still deletes pixshop_', () => {
    localStorage.setItem('bloom_theme', 'bloom');
    localStorage.setItem('pixshop_theme', 'night');
    migratePixshopToBloomKeys();
    expect(localStorage.getItem('bloom_theme')).toBe('bloom');
    expect(localStorage.getItem('pixshop_theme')).toBeNull();
  });

  it('covers every known legacy key mapping', () => {
    expect(STORAGE_KEY_MIGRATIONS.length).toBeGreaterThanOrEqual(14);
    for (const { legacy, next } of STORAGE_KEY_MIGRATIONS) {
      expect(legacy.startsWith('pixshop_')).toBe(true);
      expect(next.startsWith('bloom_')).toBe(true);
    }
  });
});
