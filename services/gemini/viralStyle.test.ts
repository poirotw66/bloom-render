/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./runImageGeneration', () => ({
  runImageGeneration: vi.fn(async () => 'data:image/png;base64,AAA'),
}));

import { runImageGeneration } from './runImageGeneration';
import { buildViralStylePrompt, generateViralStyleImage } from './viralStyle';

describe('viralStyle', () => {
  beforeEach(() => {
    vi.mocked(runImageGeneration).mockClear();
  });

  it('builds a prompt that preserves identity', () => {
    const prompt = buildViralStylePrompt('Turn into a chalk caricature.');
    expect(prompt).toContain('chalk caricature');
    expect(prompt.toLowerCase()).toMatch(/facial|likeness|identity/);
  });

  it('calls runImageGeneration with the source image', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'face.png', { type: 'image/png' });
    await generateViralStyleImage(file, 'Pixel art portrait.', { provider: 'demo' }, '1:1', {
      viralTemplateId: 'pixel-art',
    });
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [file],
        aspectRatio: '1:1',
        context: 'viral-style',
        viralTemplateId: 'pixel-art',
      }),
    );
  });
});
