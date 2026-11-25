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

  it.each([
    [401, 'error.openai_invalid_key'],
    [403, 'error.openai_permission'],
    [429, 'error.openai_rate_limit'],
    [500, 'error.openai_failed'],
  ])('maps OpenAI HTTP %i without exposing response text', (status, expected) => {
    const error = Object.assign(new Error('Private provider response'), { status });
    expect(toProviderI18nError('openai', error).message).toBe(expected);
  });

  it('distinguishes exhausted billing from transient rate limits', () => {
    const error = Object.assign(new Error('Request failed'), {
      status: 429,
      code: 'insufficient_quota',
    });
    expect(toProviderI18nError('openai', error).message).toBe('error.openai_billing');
  });

  it.each(['content_policy_violation', 'moderation_blocked'])(
    'maps OpenAI moderation %s',
    (code) => {
      expect(
        toProviderI18nError(
          'openai',
          Object.assign(new Error('Request failed'), { status: 400, code }),
        ).message,
      ).toBe('error.safety_filter');
    },
  );

  it('maps Gemini quota to quota_exceeded', () => {
    const err = toProviderI18nError('gemini', new Error('quota exceeded'));
    expect(err.message).toBe('error.quota_exceeded');
  });
});
