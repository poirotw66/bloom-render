/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  detectBrowserLanguage,
  readStoredLanguage,
  resolveLanguage,
  STORAGE_KEY_LANGUAGE,
} from './LanguageContext';

describe('resolveLanguage', () => {
  it('maps zh-* tags to zh-TW', () => {
    expect(resolveLanguage('zh')).toBe('zh-TW');
    expect(resolveLanguage('zh-CN')).toBe('zh-TW');
    expect(resolveLanguage('zh-TW')).toBe('zh-TW');
    expect(resolveLanguage('zh-Hant')).toBe('zh-TW');
  });

  it('maps en tags to en', () => {
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('en-US')).toBe('en');
  });

  it('returns null for unknown tags', () => {
    expect(resolveLanguage('ja')).toBeNull();
    expect(resolveLanguage('')).toBeNull();
    expect(resolveLanguage(null)).toBeNull();
  });
});

describe('detectBrowserLanguage', () => {
  it('prefers the first zh-* entry in navigator.languages', () => {
    expect(detectBrowserLanguage(['zh-TW', 'en-US'], 'en-US')).toBe('zh-TW');
    expect(detectBrowserLanguage(['en-US', 'zh-CN'], 'en-US')).toBe('en');
  });

  it('falls back to navigator.language when languages is empty', () => {
    expect(detectBrowserLanguage([], 'zh-HK')).toBe('zh-TW');
    expect(detectBrowserLanguage([], 'fr-FR')).toBe('en');
  });
});

describe('readStoredLanguage', () => {
  it('reads a persisted choice from storage', () => {
    const store = new Map<string, string>([[STORAGE_KEY_LANGUAGE, 'zh-TW']]);
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
    };
    expect(readStoredLanguage(storage)).toBe('zh-TW');
  });

  it('ignores invalid stored values', () => {
    const storage = { getItem: () => 'ja' };
    expect(readStoredLanguage(storage)).toBeNull();
  });
});
