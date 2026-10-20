import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();
const list = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent,
      list,
    };
  },
}));

import { geminiImageProvider } from './geminiProvider';

const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('geminiImageProvider', () => {
  beforeEach(() => {
    generateContent.mockReset();
    list.mockReset();
  });

  it('validates API keys via models.list', async () => {
    list.mockResolvedValue({ models: [] });
    await geminiImageProvider.validateApiKey('AIza-test');
    expect(list).toHaveBeenCalledOnce();
  });

  it('returns a data URL from generateContent parts', async () => {
    generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: TINY_PNG_B64 } }],
          },
        },
      ],
    });

    const result = await geminiImageProvider.generateImage({
      prompt: 'studio portrait',
      images: [{ mimeType: 'image/png', data: TINY_PNG_B64 }],
      model: 'gemini-3.1-flash-lite-image',
      apiKey: 'AIza-test',
      aspectRatio: '1:1',
      imageSize: '1K',
      includeImageConfig: true,
    });

    expect(result.dataUrl).toBe(`data:image/png;base64,${TINY_PNG_B64}`);
    expect(generateContent).toHaveBeenCalled();
    const arg = generateContent.mock.calls[0]![0];
    expect(arg.model).toBe('gemini-3.1-flash-lite-image');
    expect(arg.config.responseModalities).toEqual(['TEXT', 'IMAGE']);
    expect(arg.config.imageConfig.aspectRatio).toBe('1:1');
    expect(arg.config.imageConfig.imageSize).toBe('1K');
  });

  it('omits imageConfig when includeImageConfig is false (editor path)', async () => {
    generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: TINY_PNG_B64 } }],
          },
        },
      ],
    });

    await geminiImageProvider.generateImage({
      prompt: 'retouch',
      images: [{ mimeType: 'image/png', data: TINY_PNG_B64 }],
      model: 'gemini-3.1-flash-lite-image',
      apiKey: 'AIza-test',
      includeImageConfig: false,
    });

    const arg = generateContent.mock.calls[0]![0];
    expect(arg.config.responseModalities).toBeUndefined();
    expect(arg.config.imageConfig).toBeUndefined();
  });

  it('maps missing key to i18n error', async () => {
    await expect(
      geminiImageProvider.generateImage({
        prompt: 'x',
        model: 'gemini-3.1-flash-lite-image',
        apiKey: '  ',
      }),
    ).rejects.toThrow('error.api_key_missing');
  });
});
