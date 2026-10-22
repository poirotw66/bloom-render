/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GEMINI_API_KEY_STORAGE_KEY,
  OPENROUTER_API_KEY_STORAGE_KEY,
  REMEMBER_API_KEY_STORAGE_KEY,
  clearApiKey,
  hydrateApiKeys,
  isRememberApiKeyEnabled,
  readApiKey,
  setRememberApiKeyEnabled,
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

  it('defaults to sessionStorage-only (remember off)', () => {
    expect(isRememberApiKeyEnabled()).toBe(false);
    writeApiKey('gemini', 'AIza-test');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('AIza-test');
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(readApiKey('gemini')).toBe('AIza-test');
  });

  it('mirrors keys into localStorage when remember is on', () => {
    setRememberApiKeyEnabled(true);
    writeApiKey('openrouter', 'sk-or-test');
    expect(sessionStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('sk-or-test');
    expect(localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('sk-or-test');
  });

  it('wipes localStorage copies when remember is turned off', () => {
    setRememberApiKeyEnabled(true);
    writeApiKey('gemini', 'AIza-keep');
    writeApiKey('openrouter', 'sk-or-keep');
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('AIza-keep');
    setRememberApiKeyEnabled(false);
    expect(localStorage.getItem(REMEMBER_API_KEY_STORAGE_KEY)).toBe('false');
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBeNull();
    // Session copies remain so the current tab keeps working.
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('AIza-keep');
    expect(sessionStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)).toBe('sk-or-keep');
  });

  it('hydrate restores from localStorage into session when remember is on', () => {
    localStorage.setItem(REMEMBER_API_KEY_STORAGE_KEY, 'true');
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'AIza-persisted');
    const result = hydrateApiKeys();
    expect(result.gemini).toBe('AIza-persisted');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('AIza-persisted');
  });

  it('hydrate strips local leftovers when remember is off', () => {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, 'stale-local');
    const result = hydrateApiKeys();
    expect(result.gemini).toBe('stale-local'); // moved into session for this tab
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('stale-local');
  });

  it('clears both session and local copies', () => {
    setRememberApiKeyEnabled(true);
    writeApiKey('gemini', 'both');
    clearApiKey('gemini');
    expect(sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
  });

  it('enabling remember mirrors existing session keys', () => {
    writeApiKey('gemini', 'session-only');
    setRememberApiKeyEnabled(true);
    expect(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('session-only');
  });
});
