// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { materialFile } from './materialFile';

afterEach(() => vi.unstubAllGlobals());

describe('raster material files', () => {
  it.each([
    ['png', 'image/png'],
    ['webp', 'image/webp'],
    ['jpg', 'image/jpeg'],
  ])('preserves a %s reference filename and MIME type', async (extension, type) => {
    const bytes = new Uint8Array([1, 2, 3]);
    const blob = new Blob([bytes], { type });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const material = {
      ...TRYON_MATERIALS[3],
      image: `images/tryon-materials/example.${extension}`,
    };
    const file = await materialFile(material, controller.signal);
    expect(file.name).toBe(`${material.id}.${extension}`);
    expect(file.type).toBe(type);
    expect(file.size).toBe(blob.size);
    expect(fetchMock).toHaveBeenCalledWith(`/${material.image}`, { signal: controller.signal });
  });

  it('rejects a mismatched response instead of naming it as the expected representation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['an error response'], { type: 'text/html' }),
      }),
    );
    await expect(
      materialFile(
        { ...TRYON_MATERIALS[3], image: 'images/tryon-materials/example.png' },
        new AbortController().signal,
      ),
    ).rejects.toThrow('error.invalid_image');
  });

  it('does not return a downloaded reference after cancellation', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => {
          controller.abort();
          return new Blob(['png'], { type: 'image/png' });
        },
      }),
    );
    await expect(
      materialFile(
        { ...TRYON_MATERIALS[3], image: 'images/tryon-materials/example.png' },
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
