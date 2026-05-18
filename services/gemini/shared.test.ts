import { describe, expect, it } from 'vitest';
import {
  createI18nError,
  formatApiErrorMessage,
  getI18nErrorKey,
  isI18nErrorKey,
  normalizeApiError,
} from './shared';

describe('gemini shared errors', () => {
  const t = (key: string) => `tr:${key}`;

  it('detects i18n error keys', () => {
    expect(isI18nErrorKey('error.blocked')).toBe(true);
    expect(isI18nErrorKey('travel.error_no_images')).toBe(false);
  });

  it('passes through thrown i18n errors', () => {
    const err = createI18nError('error.quota_exceeded');
    expect(getI18nErrorKey(err)).toBe('error.quota_exceeded');
    expect(formatApiErrorMessage(err, t)).toBe('tr:error.quota_exceeded');
  });

  it('maps API key errors to i18n keys', () => {
    const result = normalizeApiError(new Error('Missing API key in request'));
    expect(result.message).toBe('error.api_key_missing');
  });

  it('maps blocked responses to i18n keys', () => {
    const result = normalizeApiError(new Error('Request was blocked. Reason: SAFETY'));
    expect(result.message).toBe('error.blocked');
  });
});
