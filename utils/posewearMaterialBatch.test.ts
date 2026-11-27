import { afterEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { buildMaterialBatchZip, materialBatchBrief } from './posewearMaterialBatch';
afterEach(() => vi.unstubAllGlobals());
describe('material batch export', () => {
  it('keeps exact variant IDs, original formats and bytes in the ZIP', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('depth bytes', { headers: { 'Content-Type': 'image/png' } }),
      )
      .mockResolvedValueOnce(
        new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } }),
      );
    vi.stubGlobal('fetch', fetcher);
    const blob = await buildMaterialBatchZip(['seated-study-back-depth', 'white-oxford-shirt']);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([
      'seated-study-back-depth.png',
      'white-oxford-shirt.svg',
    ]);
    expect(await zip.file('seated-study-back-depth.png')!.async('text')).toBe('depth bytes');
    expect(fetcher.mock.calls[0][0]).toContain('seated-study-back-depth.png');
  });
  it('rejects unknown IDs before requests and fails the whole archive on an image error', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('not found', { status: 404 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(buildMaterialBatchZip(['https://untrusted.invalid/a.png'])).rejects.toThrow(
      'Invalid material',
    );
    expect(fetcher).not.toHaveBeenCalled();
    await expect(buildMaterialBatchZip(['seated-study-back-depth'])).rejects.toThrow(
      'Could not load',
    );
  });
  it('copies exact public reference links and prompts in selection order', () => {
    const brief = materialBatchBrief(['seated-study-back-depth', 'navy-tailored-jacket'], 'en');
    expect(brief).toContain('seated-study-back-depth.png');
    expect(brief).toContain('Image 1');
    expect(brief.indexOf('seated-study-back-depth.png')).toBeLessThan(
      brief.indexOf('navy-tailored-jacket.svg'),
    );
    expect(brief).not.toContain('blob:');
  });
});
