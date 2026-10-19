import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRouterImageProvider } from './openRouterProvider';

const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('openRouterImageProvider', () => {
  afterEach(() => {
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

    expect(result).toBe(`data:image/png;base64,${TINY_PNG_B64}`);
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
