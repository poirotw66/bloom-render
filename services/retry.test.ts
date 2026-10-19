/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachHttpMeta,
  computeBackoffMs,
  getHttpStatusFromError,
  MAX_RETRIES,
  parseRetryAfterMs,
  REQUEST_TIMEOUT_MS,
  shouldRetryError,
  withRetryAndTimeout,
} from './retry';

describe('retry helpers', () => {
  it('parses Retry-After delay-seconds and HTTP-date', () => {
    expect(parseRetryAfterMs('2')).toBe(2000);
    expect(parseRetryAfterMs(null)).toBeNull();
    const future = new Date(Date.now() + 5000).toUTCString();
    const ms = parseRetryAfterMs(future);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(1000);
    expect(ms!).toBeLessThanOrEqual(5000);
  });

  it('reads status from Error message or meta', () => {
    expect(getHttpStatusFromError(new Error('OpenRouter 429: slow down'))).toBe(429);
    const withMeta = attachHttpMeta(new Error('x'), 503, '1');
    expect(getHttpStatusFromError(withMeta)).toBe(503);
    expect(withMeta.retryAfterMs).toBe(1000);
  });

  it('retries 429/5xx/network but not 400/401/403 or abort', () => {
    expect(shouldRetryError(attachHttpMeta(new Error('x'), 429))).toBe(true);
    expect(shouldRetryError(attachHttpMeta(new Error('x'), 503))).toBe(true);
    expect(shouldRetryError(new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetryError(attachHttpMeta(new Error('x'), 400))).toBe(false);
    expect(shouldRetryError(attachHttpMeta(new Error('x'), 401))).toBe(false);
    expect(shouldRetryError(attachHttpMeta(new Error('x'), 403))).toBe(false);
    expect(shouldRetryError(new DOMException('Aborted', 'AbortError'))).toBe(false);
    expect(shouldRetryError(new Error('error.api_key_missing'))).toBe(false);
  });

  it('honors Retry-After in backoff', () => {
    expect(computeBackoffMs(0, 3500)).toBe(3500);
  });
});

describe('withRetryAndTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries retryable errors up to MAX_RETRIES then succeeds', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    let calls = 0;
    const pending = withRetryAndTimeout(
      async () => {
        calls += 1;
        if (calls <= 2) {
          throw attachHttpMeta(new Error('OpenRouter 429: rate'), 429, '0');
        }
        return 'ok';
      },
      { maxRetries: MAX_RETRIES },
    );

    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBe('ok');
    expect(calls).toBe(3);
  });

  it('does not retry 401', async () => {
    let calls = 0;
    await expect(
      withRetryAndTimeout(async () => {
        calls += 1;
        throw attachHttpMeta(new Error('OpenRouter 401: bad'), 401);
      }),
    ).rejects.toThrow(/401/);
    expect(calls).toBe(1);
  });

  it('does not retry user abort', async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    await expect(
      withRetryAndTimeout(
        async () => {
          calls += 1;
          return 'x';
        },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(calls).toBe(0);
  });

  it('times out and throws error.request_timeout', async () => {
    const pending = withRetryAndTimeout(
      async (signal) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
      { timeoutMs: REQUEST_TIMEOUT_MS, maxRetries: 0 },
    );

    const assertion = expect(pending).rejects.toThrow('error.request_timeout');
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await assertion;
  });
});
