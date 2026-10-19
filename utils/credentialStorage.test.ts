/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GEMINI_API_KEY_STORAGE_KEY,
  OPENROUTER_API_KEY_STORAGE_KEY,
  clearApiKey,
  migrateAllApiKeysFromLocalStorage,
  migrateApiKeyFromLocalStorage,
  readApiKey,
  writeApiKey,
} from './credentialStorage';

describe('credentialStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('writes and reads Gemini keys from sessionStorage only', () => {
    writeApiKey('gemini', 'AIza-test');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('AIza-test');
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(readApiKey('gemini')).toBe('AIza-test');
  });

  it('writes and reads OpenRouter keys from sessionStorage only', () => {
    writeApiKey('openrouter', 'sk-or-test');
    expect(sessionStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('sk-or-test');
    expect(localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBeNull();
    expect(readApiKey('openrouter')).toBe('sk-or-test');
  });

  it('clears both session and local copies', () => {
    sessionStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'session-key');
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'local-key');
    clearApiKey('gemini');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it('migrates a Gemini key from localStorage into sessionStorage and deletes local', () => {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'legacy-gemini');
    const value = migrateApiKeyFromLocalStorage('gemini');
    expect(value).toBe('legacy-gemini');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('legacy-gemini');
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it('migrates an OpenRouter key from localStorage into sessionStorage and deletes local', () => {
    localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, 'legacy-or');
    const value = migrateApiKeyFromLocalStorage('openrouter');
    expect(value).toBe('legacy-or');
    expect(sessionStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('legacy-or');
    expect(localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it('prefers an existing sessionStorage key and still deletes localStorage leftover', () => {
    sessionStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'session-wins');
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'local-stale');
    const value = migrateApiKeyFromLocalStorage('gemini');
    expect(value).toBe('session-wins');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('session-wins');
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it('migrateAll moves both keys', () => {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'g');
    localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, 'o');
    const result = migrateAllApiKeysFromLocalStorage();
    expect(result).toEqual({ gemini: 'g', openrouter: 'o' });
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('g');
    expect(sessionStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('o');
  });

  it('writeApiKey removes any leftover localStorage value', () => {
    localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, 'stale');
    writeApiKey('openrouter', 'fresh');
    expect(localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('fresh');
  });
});
