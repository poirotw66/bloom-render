/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRestorePrompt, generateRestoredPhoto } from './restore';

vi.mock('./runImageGeneration', () => ({
  runImageGeneration: vi.fn(async () => 'data:image/png;base64,restored'),
}));

import { runImageGeneration } from './runImageGeneration';

describe('buildRestorePrompt', () => {
  it('includes colorize instructions when enabled', () => {
    const prompt = buildRestorePrompt(true);
    expect(prompt).toMatch(/COLORIZE/i);
    expect(prompt).toMatch(/scratches/i);
  });

  it('preserves palette when colorize is off', () => {
    const prompt = buildRestorePrompt(false);
    expect(prompt).toMatch(/Preserve the original color palette/i);
    expect(prompt).not.toMatch(/Also COLORIZE/);
  });
});

describe('generateRestoredPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runImageGeneration with restore context', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'old.png', { type: 'image/png' });
    const url = await generateRestoredPhoto(file, { colorize: true });
    expect(url).toContain('data:image');
    expect(runImageGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'restore',
        images: [file],
        includeImageConfig: false,
      }),
    );
    const arg = vi.mocked(runImageGeneration).mock.calls[0]![0]!;
    expect(arg.prompt).toMatch(/COLORIZE/i);
  });
});
