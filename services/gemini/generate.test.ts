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
  it('sends every ordered reference with declared roles', async () => {
    const uploaded = new File(['uploaded'], 'uploaded.png', { type: 'image/png' });
    const clothing = new File(['shirt'], 'shirt.png', { type: 'image/png' });
    const pose = new File(['pose'], 'pose.png', { type: 'image/png' });
    vi.mocked(runImageGeneration).mockResolvedValue('image-0');
    await generateImageFromText(
      'A fashion photo',
      '3:4',
      1,
      undefined,
      [uploaded, clothing, pose],
      {
        referenceHints: [
          'Uploaded style reference',
          'clothing: blue shirt',
          'pose: seated side profile',
        ],
      },
    );
    const request = vi.mocked(runImageGeneration).mock.calls[0][0];
    expect(request.images).toEqual([uploaded, clothing, pose]);
    expect(request.prompt).toContain('Image 1: Uploaded style reference');
    expect(request.prompt).toContain('Image 2: clothing: blue shirt');
    expect(request.prompt).toContain('Image 3: pose: seated side profile');
    expect(request.prompt).not.toContain('Do NOT copy the reference exactly');
  });

  it('keeps the legacy single uploaded reference behavior', async () => {
    const reference = new File(['photo'], 'photo.png', { type: 'image/png' });
    vi.mocked(runImageGeneration).mockResolvedValue('image-0');
    await generateImageFromText('A balloon', '1:1', 1, undefined, reference);
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [reference],
        prompt: expect.stringContaining('A reference image is attached'),
      }),
    );
  });

  it('rejects role mappings that do not match the ordered image inputs', async () => {
    const reference = new File(['photo'], 'photo.png', { type: 'image/png' });
    await expect(
      generateImageFromText('A balloon', '1:1', 1, undefined, [reference], { referenceHints: [] }),
    ).rejects.toThrow('error.invalid_request');
    expect(runImageGeneration).not.toHaveBeenCalled();
  });

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
