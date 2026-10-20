/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const runImageGeneration = vi.fn();
const composeMaskOverlayImage = vi.fn();
const providerSupportsNativeMask = vi.fn();

vi.mock('./runImageGeneration', () => ({
  runImageGeneration: (...args: unknown[]) => runImageGeneration(...args),
}));

vi.mock('../../utils/maskBrush', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/maskBrush')>();
  return {
    ...actual,
    composeMaskOverlayImage: (...args: unknown[]) => composeMaskOverlayImage(...args),
  };
});

vi.mock('../imageProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../imageProviders')>();
  return {
    ...actual,
    providerSupportsNativeMask: (...args: unknown[]) => providerSupportsNativeMask(...args),
  };
});

import { generateEditedImage } from './edit';

function sampleFile(name: string): File {
  return new File(['x'], name, { type: 'image/png' });
}

beforeEach(() => {
  runImageGeneration.mockReset();
  composeMaskOverlayImage.mockReset();
  providerSupportsNativeMask.mockReset();
  runImageGeneration.mockResolvedValue('data:image/png;base64,edited');
  composeMaskOverlayImage.mockResolvedValue(sampleFile('overlay.png'));
  providerSupportsNativeMask.mockReturnValue(false);
});

describe('generateEditedImage', () => {
  it('keeps the legacy hotspot-only third argument', async () => {
    await generateEditedImage(sampleFile('src.png'), 'make blue', { x: 12, y: 34 });
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [expect.any(File)],
        includeImageConfig: false,
        context: 'edit',
      }),
    );
    const prompt = runImageGeneration.mock.calls[0]![0].prompt as string;
    expect(prompt).toContain('(x: 12, y: 34)');
    expect(prompt).toContain('make blue');
    expect(composeMaskOverlayImage).not.toHaveBeenCalled();
  });

  it('overlays the mask when the provider has no native mask support', async () => {
    const mask = sampleFile('mask.png');
    const overlay = sampleFile('overlay.png');
    composeMaskOverlayImage.mockResolvedValue(overlay);
    providerSupportsNativeMask.mockReturnValue(false);

    await generateEditedImage(sampleFile('src.png'), 'remove clutter', { mask });

    expect(composeMaskOverlayImage).toHaveBeenCalledWith(expect.any(File), mask);
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [overlay],
        prompt: expect.stringContaining('pink/magenta highlights'),
      }),
    );
    expect(runImageGeneration.mock.calls[0]![0].mask).toBeUndefined();
  });

  it('passes the mask through when the provider supports native masks', async () => {
    const mask = sampleFile('mask.png');
    providerSupportsNativeMask.mockReturnValue(true);

    await generateEditedImage(sampleFile('src.png'), 'add hat', { mask });

    expect(composeMaskOverlayImage).not.toHaveBeenCalled();
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        mask,
        prompt: expect.stringContaining('mask image'),
      }),
    );
  });
});
