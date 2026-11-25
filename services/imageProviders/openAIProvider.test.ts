import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOpenAIImageSize, openAIImageProvider } from './openAIProvider';
import type { GenerateImageRequest } from './types';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const request: GenerateImageRequest = {
  apiKey: 'sk-test-only',
  model: 'gpt-image-2.6-sunburst',
  prompt: 'A red jacket',
};
const success = () => new Response(JSON.stringify({ data: [{ b64_json: PNG }] }));
const failure = (status: number, code?: string, retryAfter = '0') =>
  new Response(JSON.stringify({ error: { code, message: 'never show sk-private-response' } }), {
    status,
    headers: { 'Retry-After': retryAfter },
  });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OpenAI image sizes', () => {
  it.each(['1K', '2K', '4K'])(
    'keeps every supported aspect ratio within modern API bounds at %s',
    (imageSize) => {
      for (const aspect of ['1:3', '9:16', '3:4', '1:1', '4:3', '16:9', '3:1']) {
        const [w, h] = getOpenAIImageSize(request.model, aspect, imageSize)
          .split('x')
          .map(Number) as [number, number];
        expect(w % 16).toBe(0);
        expect(h % 16).toBe(0);
        expect(Math.max(w, h)).toBeLessThanOrEqual(3840);
        expect(w * h).toBeGreaterThanOrEqual(655_360);
        expect(w * h).toBeLessThanOrEqual(8_294_400);
        expect(w / h).toBeGreaterThanOrEqual(1 / 3);
        expect(w / h).toBeLessThanOrEqual(3);
        expect(
          Math.abs(w / h - Number(aspect.split(':')[0]) / Number(aspect.split(':')[1])),
        ).toBeLessThan(0.06);
      }
    },
  );

  it('maps 4K widescreen exactly and keeps legacy sizes supported', () => {
    expect(getOpenAIImageSize(request.model, '16:9', '4K')).toBe('3840x2160');
    expect(getOpenAIImageSize(request.model, '9:16', '4K')).toBe('2160x3840');
    expect(getOpenAIImageSize('gpt-image-1.5', '1:1', '4K')).toBe('1024x1024');
    expect(getOpenAIImageSize('gpt-image-1.5', '16:9', '2K')).toBe('1536x1024');
    expect(getOpenAIImageSize('gpt-image-1.5', '9:16')).toBe('1024x1536');
  });

  it.each(['4:1', '1:4', '0:1', '1:0', 'invalid'])(
    'rejects unsupported aspect ratio %s before a billable request',
    (aspect) =>
      expect(() => getOpenAIImageSize(request.model, aspect)).toThrow('error.invalid_request'),
  );
});

describe('openAIImageProvider', () => {
  it('validates credentials with a non-billable models GET', async () => {
    const fetchMock = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    await openAIImageProvider.validateApiKey('  sk-test-only  ');
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: 'Bearer sk-test-only' },
      signal: expect.any(AbortSignal),
    });
  });

  it('uses JSON generations and returns a PNG without inventing billing', async () => {
    const fetchMock = vi.fn(async () => success());
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      openAIImageProvider.generateImage({ ...request, aspectRatio: '16:9', imageSize: '4K' }),
    ).resolves.toEqual({ dataUrl: `data:image/png;base64,${PNG}` });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/images/generations');
    expect(init.headers).toEqual({
      Authorization: 'Bearer sk-test-only',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      model: request.model,
      prompt: request.prompt,
      n: 1,
      size: '3840x2160',
      output_format: 'png',
    });
  });

  it('posts ordered reference files as multipart edits with automatic boundary headers', async () => {
    const fetchMock = vi.fn(async () => success());
    vi.stubGlobal('fetch', fetchMock);
    await openAIImageProvider.generateImage({
      ...request,
      images: [
        { mimeType: 'image/png', data: PNG },
        { mimeType: 'image/jpeg', data: btoa('second-reference') },
        { mimeType: 'image/webp', data: btoa('third-reference') },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/images/edits');
    expect(init.headers).toEqual({ Authorization: 'Bearer sk-test-only' });
    const form = init.body as FormData;
    expect(form.get('prompt')).toBe(request.prompt);
    expect(form.get('output_format')).toBe('png');
    expect(form.get('n')).toBe('1');
    expect(form.has('input_fidelity')).toBe(false);
    const files = form.getAll('image[]') as File[];
    expect(files.map((file) => [file.name, file.type])).toEqual([
      ['reference-1.png', 'image/png'],
      ['reference-2.jpg', 'image/jpeg'],
      ['reference-3.webp', 'image/webp'],
    ]);
    expect(new Uint8Array(await files[0]!.arrayBuffer())).toEqual(
      Uint8Array.from(atob(PNG), (char) => char.charCodeAt(0)),
    );
    expect(await files[1]!.text()).toBe('second-reference');
    expect(await files[2]!.text()).toBe('third-reference');
  });

  it('uses high input fidelity only for legacy GPT Image 1.5 edits', async () => {
    const fetchMock = vi.fn(async () => success());
    vi.stubGlobal('fetch', fetchMock);
    await openAIImageProvider.generateImage({
      ...request,
      model: 'gpt-image-1.5',
      aspectRatio: '3:4',
      images: [{ mimeType: 'image/png', data: PNG }],
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.get('input_fidelity')).toBe('high');
    expect(form.get('size')).toBe('1024x1536');
  });

  it.each([
    { model: 'openai/gpt-image-1' },
    { prompt: ' ' },
    { images: [{ mimeType: 'image/gif', data: PNG }] },
    { images: [{ mimeType: 'image/png', data: '%%%bad-base64' }] },
    { images: Array.from({ length: 17 }, () => ({ mimeType: 'image/png', data: PNG })) },
    { mask: { mimeType: 'image/png', data: PNG } },
    { imageSize: '8K' },
    { imageSize: 'constructor' },
  ])('rejects invalid input without making requests (%j)', async (overrides) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(openAIImageProvider.generateImage({ ...request, ...overrides })).rejects.toThrow(
      'error.invalid_request',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a nonempty key for validation and generation', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(openAIImageProvider.validateApiKey(' ')).rejects.toThrow(
      'error.openai_invalid_key',
    );
    await expect(openAIImageProvider.generateImage({ ...request, apiKey: '' })).rejects.toThrow(
      'error.openai_invalid_key',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, undefined, 'error.openai_invalid_key'],
    [403, undefined, 'error.openai_permission'],
    [400, undefined, 'error.invalid_request'],
    [400, 'content_policy_violation', 'error.safety_filter'],
    [400, 'moderation_blocked', 'error.safety_filter'],
    [429, 'insufficient_quota', 'error.openai_billing'],
    [429, 'billing_hard_limit_reached', 'error.openai_billing'],
  ])('maps HTTP %s/%s safely without retrying', async (status, code, expected) => {
    const fetchMock = vi.fn(async () => failure(status as number, code));
    vi.stubGlobal('fetch', fetchMock);
    await expect(openAIImageProvider.generateImage(request)).rejects.toThrow(expected);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    null,
    {},
    { data: [] },
    { data: [{ url: 'https://example.com/remote.png' }] },
    { data: [{ b64_json: '%bad%' }] },
  ])('does not regenerate successful responses with missing image data (%j)', async (body) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body)));
    vi.stubGlobal('fetch', fetchMock);
    await expect(openAIImageProvider.generateImage(request)).rejects.toThrow('error.no_image');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('honors Retry-After before retrying rate limits', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(failure(429, undefined, '3'))
      .mockImplementation(async () => success());
    vi.stubGlobal('fetch', fetchMock);
    const pending = openAIImageProvider.generateImage(request);
    const assertion = expect(pending).resolves.toEqual({ dataUrl: `data:image/png;base64,${PNG}` });
    await vi.advanceTimersByTimeAsync(2999);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps an exhausted rate limit without leaking response details', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => failure(429));
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(openAIImageProvider.generateImage(request)).rejects.toThrow(
      'error.openai_rate_limit',
    );
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a transient server error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(failure(503))
      .mockImplementation(async () => success());
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(openAIImageProvider.generateImage(request)).resolves.toEqual({
      dataUrl: `data:image/png;base64,${PNG}`,
    });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps exhausted server errors to a safe provider failure', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => failure(500));
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(openAIImageProvider.generateImage(request)).rejects.toThrow(
      'error.openai_failed',
    );
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries network failures and preserves the safe network error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(openAIImageProvider.generateImage(request)).rejects.toThrow(
      'error.network_error',
    );
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('cancels Retry-After waiting without another attempt', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const fetchMock = vi.fn(async () => failure(429, undefined, '3'));
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(
      openAIImageProvider.generateImage({ ...request, signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1000);
    controller.abort();
    await assertion;
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('preserves preflight cancellation without requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const signal = AbortSignal.abort();
    await expect(openAIImageProvider.generateImage({ ...request, signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(openAIImageProvider.validateApiKey(request.apiKey, signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves cancellation during generation and never retries it', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      controller.abort();
      expect(init?.signal?.aborted).toBe(true);
      throw new DOMException('Aborted', 'AbortError');
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      openAIImageProvider.generateImage({ ...request, signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('times out a stalled request without retrying', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(openAIImageProvider.generateImage(request)).rejects.toThrow(
      'error.request_timeout',
    );
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
