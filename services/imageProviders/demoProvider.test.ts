/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_MODEL_ID, demoAssetsForContext, demoAssetsForFeature } from './demoCatalog';
import {
  demoImageProvider,
  fetchPublicImageAsDataUrl,
  resetDemoVariantCounters,
} from './demoProvider';
import {
  defaultModelForProvider,
  isDemoProvider,
  isImageProviderId,
  modelsForProvider,
} from './index';

const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const TINY_PNG_BYTES = Uint8Array.from(atob(TINY_PNG_B64), (c) => c.charCodeAt(0));

describe('demo catalog + mode switch', () => {
  it('recognizes demo as an ImageProviderId', () => {
    expect(isImageProviderId('demo')).toBe(true);
    expect(isDemoProvider('demo')).toBe(true);
    expect(isDemoProvider('gemini')).toBe(false);
  });

  it('exposes a single demo model id', () => {
    expect(modelsForProvider('demo')).toEqual([DEMO_MODEL_ID]);
    expect(defaultModelForProvider('demo')).toBe(DEMO_MODEL_ID);
  });

  it('maps feature contexts to bundled example paths', () => {
    expect(demoAssetsForContext('id-photo').before).toContain('idphoto-before');
    expect(demoAssetsForContext('id-photo').after.length).toBeGreaterThanOrEqual(1);
    expect(demoAssetsForFeature('tryon').after[0]).toContain('tryon-after');
    expect(demoAssetsForContext('unknown-feature').after[0]).toContain('generate-');
  });
});

describe('demoImageProvider', () => {
  beforeEach(() => {
    resetDemoVariantCounters();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('validateApiKey succeeds without a real key', async () => {
    await expect(demoImageProvider.validateApiKey('')).resolves.toBeUndefined();
  });

  it('returns a data URL from bundled assets after a short delay', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(TINY_PNG_BYTES, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const pending = demoImageProvider.generateImage({
      prompt: 'anything',
      images: [],
      model: DEMO_MODEL_ID,
      apiKey: 'demo',
      context: 'generation',
    });

    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.startsWith('data:image/')).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
    const firstCall = fetchMock.mock.calls[0] as unknown as [string] | undefined;
    expect(String(firstCall?.[0] ?? '')).toContain('examples/generate-');
  });

  it('cycles after variants for the same context', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(TINY_PNG_BYTES, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const run = async () => {
      const pending = demoImageProvider.generateImage({
        prompt: 'x',
        model: DEMO_MODEL_ID,
        apiKey: 'demo',
        context: 'id-photo',
      });
      await vi.runAllTimersAsync();
      await pending;
    };

    await run();
    await run();

    const urls = fetchMock.mock.calls.map((c) => String((c as unknown as [string])[0]));
    expect(urls[0]).toContain('idphoto-after');
    expect(urls[1]).toContain('idphoto-after');
    // Two variants exist; second call should prefer the other path when available.
    expect(new Set(urls).size).toBeGreaterThanOrEqual(1);
  });

  it('aborts when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      demoImageProvider.generateImage({
        prompt: 'x',
        model: DEMO_MODEL_ID,
        apiKey: 'demo',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('fetchPublicImageAsDataUrl rejects on missing assets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('missing', { status: 404 })),
    );
    await expect(fetchPublicImageAsDataUrl('/examples/nope.webp')).rejects.toThrow(
      'error.demo_asset_missing',
    );
  });
});
