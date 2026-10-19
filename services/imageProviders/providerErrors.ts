import { createI18nError, isI18nErrorKey } from '../gemini/shared';

function getRawMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err ?? '');
}

/**
 * Map provider failures to BloomRender i18n error keys (error.*).
 * Pass-through when the error is already an i18n key.
 */
export function toProviderI18nError(providerId: 'gemini' | 'openrouter', err: unknown): Error {
  const raw = getRawMessage(err);
  if (isI18nErrorKey(raw)) {
    return err instanceof Error ? err : createI18nError(raw);
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('unauthorized') ||
    lower.includes('401') ||
    lower.includes('invalid api key') ||
    lower.includes('api_key_invalid') ||
    lower.includes('missing authentication')
  ) {
    return createI18nError(
      providerId === 'openrouter' ? 'error.openrouter_invalid_key' : 'error.api_key_missing',
    );
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('overload')
  ) {
    return createI18nError(
      providerId === 'openrouter' ? 'error.openrouter_rate_limit' : 'error.quota_exceeded',
    );
  }

  if (lower.includes('blocked') || lower.includes('blockreason')) {
    return createI18nError('error.blocked');
  }

  if (lower.includes('safety') || lower.includes('finishreason')) {
    return createI18nError('error.safety_filter');
  }

  if (
    lower.includes('no image') ||
    lower.includes('did not return an image') ||
    lower.includes('no image data')
  ) {
    return createI18nError('error.no_image');
  }

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('failed to download')
  ) {
    return createI18nError('error.network_error');
  }

  if (
    lower.includes('input_reference') ||
    lower.includes('reference image') ||
    lower.includes('does not support')
  ) {
    return createI18nError('error.openrouter_model_no_image_ref');
  }

  if (lower.includes('invalid') || lower.includes('bad request') || lower.includes('400')) {
    return createI18nError('error.invalid_request');
  }

  return createI18nError(providerId === 'openrouter' ? 'error.openrouter_failed' : 'error.unknown');
}
