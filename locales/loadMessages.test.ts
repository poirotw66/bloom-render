// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enMessages } from './en';

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.doUnmock('./en');
  vi.doUnmock('./zh-TW');
  vi.unstubAllGlobals();
});

describe('loadMessages', () => {
  it('imports only the requested locale and shares its in-flight load', async () => {
    const otherLocale = vi.fn(() => ({ zhTWMessages: { hello: '你好' } }));
    vi.doMock('./en', () => ({ enMessages: { hello: 'Hello' } }));
    vi.doMock('./zh-TW', otherLocale);
    const loader = await import('./loadMessages');
    const first = loader.loadMessages('en');
    expect(loader.loadMessages('en')).toBe(first);
    await expect(first).resolves.toEqual({ hello: 'Hello' });
    expect(loader.getLoadedMessages('en')).toEqual({ hello: 'Hello' });
    expect(otherLocale).not.toHaveBeenCalled();
  });

  it('keeps only the latest build dictionary for a language in its app-scoped offline cache', async () => {
    const staleUrl = `${window.location.origin}/__locale-cache/en/old-build`;
    const cache = {
      put: vi.fn(async () => undefined),
      keys: vi.fn(async () => [{ url: staleUrl }]),
      delete: vi.fn(async () => true),
    };
    const open = vi.fn(async () => cache);
    vi.stubGlobal('caches', { open });
    vi.doMock('./en', () => ({ enMessages: { hello: 'Hello' } }));
    const loader = await import('./loadMessages');
    await loader.loadMessages('en');
    expect(open).toHaveBeenCalledWith('bloomrender-locale-messages:/');
    expect(cache.put).toHaveBeenCalledWith(
      expect.stringContaining('/__locale-cache/en/'),
      expect.any(Response),
    );
    await vi.waitFor(() => expect(cache.delete).toHaveBeenCalledWith({ url: staleUrl }));
  });

  it('uses the exact-build offline dictionary when a dynamic import cannot load', async () => {
    vi.doMock('./en', () => {
      throw new Error('Offline');
    });
    const cachedMessages = { ...enMessages, 'app.title': 'Cached BloomRender' };
    const match = vi.fn(async () => new Response(JSON.stringify(cachedMessages)));
    vi.stubGlobal('caches', { open: async () => ({ match }) });
    const loader = await import('./loadMessages');
    await expect(loader.loadMessages('en')).resolves.toEqual(cachedMessages);
    expect(match).toHaveBeenCalledWith(expect.stringContaining('/__locale-cache/en/'));
  });

  it('rejects a malformed offline dictionary instead of rendering invalid values', async () => {
    vi.doMock('./en', () => {
      throw new Error('Offline');
    });
    vi.stubGlobal('caches', {
      open: async () => ({ match: async () => new Response(JSON.stringify({ hello: 123 })) }),
    });
    const loader = await import('./loadMessages');
    await expect(loader.loadMessages('en')).rejects.toThrow();
    expect(loader.getLoadedMessages('en')).toBeUndefined();
  });

  it('loads normally when optional offline storage is unavailable', async () => {
    vi.doMock('./en', () => ({ enMessages: { hello: 'Hello' } }));
    vi.stubGlobal('caches', {
      open: async () => {
        throw new Error('Storage denied');
      },
    });
    const loader = await import('./loadMessages');
    await expect(loader.loadMessages('en')).resolves.toEqual({ hello: 'Hello' });
  });
});
