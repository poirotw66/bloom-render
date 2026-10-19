/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImageIfNeeded, imageExceedsMaxEdge } from './fileUtils';

vi.mock('./imageCompressionWorker', () => ({
  compressImage: vi.fn(async (_file: File) => {
    return new File([new Uint8Array([1, 2, 3])], 'compressed.jpg', { type: 'image/jpeg' });
  }),
}));

import { compressImage } from './imageCompressionWorker';

describe('imageExceedsMaxEdge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when the long edge is above the max', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() })),
    );
    const file = new File([new Uint8Array([0])], 'big.jpg', { type: 'image/jpeg' });
    await expect(imageExceedsMaxEdge(file, 2048)).resolves.toBe(true);
  });

  it('returns false when both edges are within the max', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 1024, height: 768, close: vi.fn() })),
    );
    const file = new File([new Uint8Array([0])], 'small.jpg', { type: 'image/jpeg' });
    await expect(imageExceedsMaxEdge(file, 2048)).resolves.toBe(false);
  });
});

describe('compressImageIfNeeded', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('downscales when long edge exceeds 2048 even if under the byte threshold', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() })),
    );
    const file = new File([new Uint8Array(100)], 'phone.jpg', { type: 'image/jpeg' });
    const out = await compressImageIfNeeded(file, { maxWidth: 2048, maxHeight: 2048 }, 5);
    expect(compressImage).toHaveBeenCalledOnce();
    expect(out.name).toBe('compressed.jpg');
  });

  it('skips compression when small in both bytes and pixels', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })),
    );
    const file = new File([new Uint8Array(100)], 'tiny.jpg', { type: 'image/jpeg' });
    const out = await compressImageIfNeeded(file, { maxWidth: 2048, maxHeight: 2048 }, 5);
    expect(compressImage).not.toHaveBeenCalled();
    expect(out).toBe(file);
  });
});
