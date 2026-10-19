/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared retry + timeout for image provider network calls.
 * Retries 429 / 5xx / network errors (max 2). Never retries 400/401/403 or user abort.
 */

import { createI18nError } from './gemini/shared';

export const REQUEST_TIMEOUT_MS = 120_000;
export const MAX_RETRIES = 2;

const TIMEOUT_REASON = 'bloomrender-timeout';

export type RetryableError = Error & {
  status?: number;
  retryAfterMs?: number | null;
};

export function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

export function parseRetryAfterMs(header: string | null | undefined): number | null {
  if (!header) return null;
  const asSeconds = Number(header);
  if (!Number.isNaN(asSeconds) && header.trim() !== '') {
    // Numeric Retry-After is delay-seconds.
    if (/^\d+(\.\d+)?$/.test(header.trim())) {
      return Math.max(0, Math.round(asSeconds * 1000));
    }
  }
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now());
  }
  return null;
}

export function getHttpStatusFromError(err: unknown): number | null {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number' && Number.isFinite(status)) return status;
  }
  if (err instanceof Error) {
    const match = err.message.match(/\b([45]\d{2})\b/);
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}

export function getRetryAfterMsFromError(err: unknown): number | null {
  if (err && typeof err === 'object' && 'retryAfterMs' in err) {
    const value = (err as { retryAfterMs?: unknown }).retryAfterMs;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

export function shouldRetryError(err: unknown): boolean {
  if (isAbortError(err)) return false;
  if (err instanceof Error && err.message === 'error.request_timeout') return false;

  const status = getHttpStatusFromError(err);
  if (status != null) {
    if (status === 400 || status === 401 || status === 403) return false;
    if (status === 429 || status >= 500) return true;
    return false;
  }

  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.startsWith('error.')) {
      // Explicit client i18n errors (missing key, invalid request, etc.) are not retried.
      // Rate-limit / network style keys may still retry.
      if (
        msg.includes('rate_limit') ||
        msg.includes('quota') ||
        msg.includes('network') ||
        msg.includes('openrouter_failed')
      ) {
        return true;
      }
      return false;
    }
    if (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('fetch failed') ||
      msg.includes('load failed')
    ) {
      return true;
    }
    if (msg.includes('429') || msg.includes('502') || msg.includes('503') || msg.includes('500')) {
      return true;
    }
    if (msg.includes('rate limit') || msg.includes('quota')) return true;
  }
  return false;
}

/** Exponential backoff with jitter. Honors Retry-After when provided. */
export function computeBackoffMs(attempt: number, retryAfterMs?: number | null): number {
  if (retryAfterMs != null && retryAfterMs > 0) return retryAfterMs;
  const base = Math.min(1000 * 2 ** attempt, 8000);
  const jitter = Math.random() * base * 0.25;
  return Math.round(base + jitter);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function combineAbortSignals(user?: AbortSignal, timeout?: AbortSignal): AbortSignal {
  if (user && timeout) {
    const Any = (
      AbortSignal as typeof AbortSignal & {
        any?: (signals: AbortSignal[]) => AbortSignal;
      }
    ).any;
    if (typeof Any === 'function') {
      return Any([user, timeout]);
    }
    const merged = new AbortController();
    const forward = (source: AbortSignal) => {
      if (source.aborted) {
        merged.abort(source.reason);
        return;
      }
      source.addEventListener('abort', () => merged.abort(source.reason), { once: true });
    };
    forward(user);
    forward(timeout);
    return merged.signal;
  }
  return (timeout ?? user ?? new AbortController().signal) as AbortSignal;
}

/**
 * Run `operation` with a ~120s timeout and up to `maxRetries` retries on
 * retryable failures. User AbortSignal cancellation is never retried.
 */
export async function withRetryAndTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    maxRetries?: number;
  } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort(TIMEOUT_REASON);
    }, timeoutMs);

    const combined = combineAbortSignals(options.signal, timeoutController.signal);

    try {
      const result = await operation(combined);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);

      const timedOut =
        timeoutController.signal.aborted && timeoutController.signal.reason === TIMEOUT_REASON;

      if (options.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      if (timedOut) {
        throw createI18nError('error.request_timeout');
      }
      if (isAbortError(err)) {
        throw err;
      }

      lastError = err;
      if (attempt >= maxRetries || !shouldRetryError(err)) {
        throw err;
      }

      const delay = computeBackoffMs(attempt, getRetryAfterMsFromError(err));
      await sleep(delay, options.signal);
    }
  }

  throw lastError;
}

export function attachHttpMeta(
  error: Error,
  status: number,
  retryAfterHeader?: string | null,
): RetryableError {
  const withMeta = error as RetryableError;
  withMeta.status = status;
  withMeta.retryAfterMs = parseRetryAfterMs(retryAfterHeader);
  return withMeta;
}
