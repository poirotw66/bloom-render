// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runImageGeneration } from './runImageGeneration';
import { generateEditedImage } from './edit';
import { generateOptimizedPrompt } from './optimizePrompt';
import { getClient } from './client';
import {
  DEFAULT_OPENAI_MODEL,
  modelsForProvider,
  resolveStoredOpenAIModel,
  modelSupportsMultiResolution,
} from '../imageProviders';

const googleConstructor = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor() {
      googleConstructor();
    }
  },
}));
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const settings = {
  provider: 'openai',
  apiKey: 'mock-openai-key',
  model: DEFAULT_OPENAI_MODEL,
} as const;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function mockImages() {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ data: [{ b64_json: png }] }), { status: 200 }),
    );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('OpenAI provider integration', () => {
  it('routes text generation to the direct OpenAI API with the chosen key and model', async () => {
    const fetch = mockImages();
    await expect(
      runImageGeneration({
        prompt: 'A red balloon',
        settings,
        aspectRatio: '16:9',
        imageSize: '2K',
      }),
    ).resolves.toBe(`data:image/png;base64,${png}`);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/generations');
    const request = fetch.mock.calls[0][1];
    expect(request.headers).toMatchObject({ Authorization: 'Bearer mock-openai-key' });
    expect(JSON.parse(request.body)).toMatchObject({
      model: DEFAULT_OPENAI_MODEL,
      prompt: 'A red balloon',
    });
    expect(googleConstructor).not.toHaveBeenCalled();
  });

  it('routes editor references to OpenAI edits without calling Gemini', async () => {
    const fetch = mockImages();
    const original = new File([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], 'person.png', {
      type: 'image/png',
    });
    await expect(
      generateEditedImage(original, 'make the shirt blue', { x: 0.5, y: 0.5 }, settings),
    ).resolves.toBe(`data:image/png;base64,${png}`);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/edits');
    expect(fetch.mock.calls[0][1].body.getAll('image[]')).toHaveLength(1);
    expect(googleConstructor).not.toHaveBeenCalled();
  });

  it('refuses Gemini-only planning and SDK use before an OpenAI key can reach Google', async () => {
    const fetch = mockImages();
    await expect(generateOptimizedPrompt('portrait', undefined, settings)).rejects.toThrow(
      'error.optimize_prompt_gemini_only',
    );
    await expect(getClient(settings)).rejects.toThrow('error.optimize_prompt_gemini_only');
    expect(googleConstructor).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('restores only catalog models and exposes resolution support per model', () => {
    expect(resolveStoredOpenAIModel('gemini-3.1-flash-image')).toBe(DEFAULT_OPENAI_MODEL);
    expect(resolveStoredOpenAIModel('gpt-image-1.5')).toBe('gpt-image-1.5');
    expect(modelsForProvider('openai')).toContain(DEFAULT_OPENAI_MODEL);
    expect(modelSupportsMultiResolution(DEFAULT_OPENAI_MODEL)).toBe(true);
    expect(modelSupportsMultiResolution('gpt-image-1.5')).toBe(false);
  });
});
