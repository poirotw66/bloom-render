import { describe, expect, it } from 'vitest';
import { toProviderI18nError } from './providerErrors';

describe('toProviderI18nError', () => {
  it('passes through existing i18n keys', () => {
    const err = toProviderI18nError('gemini', new Error('error.blocked'));
    expect(err.message).toBe('error.blocked');
  });

  it('maps OpenRouter unauthorized to invalid key', () => {
    const err = toProviderI18nError('openrouter', new Error('OpenRouter 401: unauthorized'));
    expect(err.message).toBe('error.openrouter_invalid_key');
  });

  it('maps Gemini quota to quota_exceeded', () => {
    const err = toProviderI18nError('gemini', new Error('quota exceeded'));
    expect(err.message).toBe('error.quota_exceeded');
  });
});
