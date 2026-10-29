/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildGeneratePrompt, generateImageFromText } from './generate';
import { runImageGeneration } from './runImageGeneration';

vi.mock('./runImageGeneration', () => ({ runImageGeneration: vi.fn() }));

beforeEach(() => {
  vi.mocked(runImageGeneration).mockReset();
});

describe('buildGeneratePrompt', () => {
  it('returns the user prompt unchanged when there is no reference image', () => {
    expect(buildGeneratePrompt('a red balloon', false)).toBe('a red balloon');
  });

  it('appends reference guidance when a reference image is present', () => {
    const result = buildGeneratePrompt('a red balloon', true);
    expect(result.startsWith('a red balloon\n\n')).toBe(true);
    expect(result).toContain('A reference image is attached');
    expect(result).toContain('Do NOT copy the reference exactly');
  });
});

describe('generateImageFromText', () => {
  it('retains successful images when another slot fails', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce('image-0')
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce('image-2')
      .mockResolvedValueOnce('image-3');

    await expect(generateImageFromText('a red balloon', '1:1', 4)).resolves.toEqual([
      'image-0',
      'image-2',
      'image-3',
    ]);
    expect(runImageGeneration).toHaveBeenCalledTimes(4);
  });

  it('returns all successful images in slot order even when they finish out of order', async () => {
    let resolveFirst!: (url: string) => void;
    vi.mocked(runImageGeneration)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce('image-1');

    const pending = generateImageFromText('a red balloon', '1:1', 2);
    resolveFirst('image-0');
    await expect(pending).resolves.toEqual(['image-0', 'image-1']);
  });

  it('throws the first real failure when every slot fails', async () => {
    const firstError = new Error('error.api_key_missing');
    vi.mocked(runImageGeneration)
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(new Error('error.quota_exceeded'));

    await expect(generateImageFromText('a red balloon', '1:1', 2)).rejects.toBe(firstError);
  });

  it('preserves a single-image abort for model comparison and forwards the signal', async () => {
    const controller = new AbortController();
    const error = new DOMException('Aborted', 'AbortError');
    vi.mocked(runImageGeneration).mockRejectedValueOnce(error);

    await expect(
      generateImageFromText('a red balloon', '3:4', 1, { abortSignal: controller.signal }),
    ).rejects.toBe(error);
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ settings: { abortSignal: controller.signal }, aspectRatio: '3:4' }),
    );
  });
});
