import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRouterImageProvider } from './openRouterProvider';

const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('openRouterImageProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('validates API keys via models list', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await openRouterImageProvider.validateApiKey('sk-or-test');
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(call[0])).toContain('openrouter.ai/api/v1/models');
    expect(call[1].headers).toMatchObject({
      Authorization: 'Bearer sk-or-test',
    });
  });

  it('generates an image via POST /api/v1/images', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/images')) {
        return new Response(
          JSON.stringify({
            data: [{ b64_json: TINY_PNG_B64, media_type: 'image/png' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await openRouterImageProvider.generateImage({
      prompt: 'travel photo at the beach',
      images: [{ mimeType: 'image/png', data: TINY_PNG_B64 }],
      model: 'google/gemini-2.5-flash-image',
      apiKey: 'sk-or-test',
      aspectRatio: '16:9',
      imageSize: '1K',
    });

    expect(result.dataUrl).toBe(`data:image/png;base64,${TINY_PNG_B64}`);
    expect(result.costUsd).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(call[1].body));
    expect(body.model).toBe('google/gemini-2.5-flash-image');
    expect(body.aspect_ratio).toBe('16:9');
    expect(body.resolution).toBe('1K');
    expect(body.input_references).toHaveLength(1);
  });

  it('supports text-to-image without input_references', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [{ b64_json: TINY_PNG_B64, media_type: 'image/png' }],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await openRouterImageProvider.generateImage({
      prompt: 'a red bicycle',
      images: [],
      model: 'google/gemini-2.5-flash-image',
      apiKey: 'sk-or-test',
      aspectRatio: '1:1',
    });

    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(call[1].body));
    expect(body.input_references).toBeUndefined();
    expect(body.prompt).toBe('a red bicycle');
  });

  it('prefers usage.cost from the OpenRouter response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              data: [{ b64_json: TINY_PNG_B64, media_type: 'image/png' }],
              usage: { cost: 0.04 },
            }),
            { status: 200 },
          ),
      ),
    );

    const result = await openRouterImageProvider.generateImage({
      prompt: 'costed',
      model: 'google/gemini-2.5-flash-image',
      apiKey: 'sk-or-test',
    });
    expect(result.costUsd).toBe(0.04);
  });

  it('maps 401 to OpenRouter invalid key i18n error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), {
            status: 401,
          }),
      ),
    );

    await expect(
      openRouterImageProvider.generateImage({
        prompt: 'test',
        model: 'google/gemini-2.5-flash-image',
        apiKey: 'bad',
      }),
    ).rejects.toThrow('error.openrouter_invalid_key');
  });

  it.each(['503', 'network'])(
    'retries a %s download failure without repeating generation',
    async (failure) => {
      vi.useFakeTimers();
      const imageUrl = 'https://images.example/result.png';
      let downloads = 0;
      const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
        if (String(input) !== imageUrl) {
          return new Response(JSON.stringify({ data: [{ url: imageUrl }], usage: { cost: 0.04 } }));
        }
        if (++downloads === 1) {
          if (failure === 'network') throw new TypeError('Failed to fetch');
          return new Response('', { status: 503 });
        }
        return new Response(
          Uint8Array.from(atob(TINY_PNG_B64), (char) => char.charCodeAt(0)),
          {
            headers: { 'Content-Type': 'image/png' },
          },
        );
      });
      vi.stubGlobal('fetch', fetchMock);

      const pending = openRouterImageProvider.generateImage({
        prompt: 'test',
        model: 'image-model',
        apiKey: 'sk-or-test',
      });
      await vi.runAllTimersAsync();
      await expect(pending).resolves.toEqual({
        dataUrl: `data:image/png;base64,${TINY_PNG_B64}`,
        costUsd: 0.04,
      });
      expect(downloads).toBe(2);
      expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    },
  );

  it('exhausts download retries without repeating generation and preserves error mapping', async () => {
    vi.useFakeTimers();
    const imageUrl = 'https://images.example/result.png';
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) =>
      String(input) === imageUrl
        ? new Response('', { status: 503 })
        : new Response(JSON.stringify({ data: [{ url: imageUrl }] })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const pending = openRouterImageProvider.generateImage({
      prompt: 'test',
      model: 'image-model',
      apiKey: 'sk-or-test',
    });
    const assertion = expect(pending).rejects.toThrow('error.openrouter_rate_limit');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === imageUrl)).toHaveLength(3);
  });

  it('does not retry or regenerate when the user aborts the image download', async () => {
    const controller = new AbortController();
    const imageUrl = 'https://images.example/result.png';
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== imageUrl) {
        return new Response(JSON.stringify({ data: [{ url: imageUrl }] }));
      }
      expect(init?.signal?.aborted).toBe(false);
      controller.abort();
      expect(init?.signal?.aborted).toBe(true);
      throw new DOMException('Aborted', 'AbortError');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      openRouterImageProvider.generateImage({
        prompt: 'test',
        model: 'image-model',
        apiKey: 'sk-or-test',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('times out image downloads without repeating generation', async () => {
    vi.useFakeTimers();
    const imageUrl = 'https://images.example/result.png';
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== imageUrl) {
        return new Response(JSON.stringify({ data: [{ url: imageUrl }] }));
      }
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const pending = openRouterImageProvider.generateImage({
      prompt: 'test',
      model: 'image-model',
      apiKey: 'sk-or-test',
    });
    const assertion = expect(pending).rejects.toThrow('error.request_timeout');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps 429 to OpenRouter rate limit i18n error after retries', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Rate limit' } }), {
            status: 429,
            headers: { 'Retry-After': '0' },
          }),
      ),
    );

    const pending = openRouterImageProvider.generateImage({
      prompt: 'test',
      model: 'google/gemini-2.5-flash-image',
      apiKey: 'sk-or-test',
    });
    const assertion = expect(pending).rejects.toThrow('error.openrouter_rate_limit');
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
  });
});
