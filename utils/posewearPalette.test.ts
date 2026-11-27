// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractMaterialPalette, quantizeMaterialPalette } from './posewearPalette';

const SIZE = 48;
type RGBA = [number, number, number, number];
const pixels = () => new Uint8ClampedArray(SIZE * SIZE * 4);
function paint(data: Uint8ClampedArray, x: number, y: number, color: RGBA) {
  data.set(color, (y * SIZE + x) * 4);
}
function loadedImage() {
  const image = document.createElement('img');
  Object.defineProperties(image, {
    complete: { value: true },
    naturalWidth: { value: 100 },
    naturalHeight: { value: 100 },
  });
  return image;
}
afterEach(() => vi.restoreAllMocks());

describe('PoseWear palette quantization', () => {
  it('skips transparent pixels and near-white backgrounds', () => {
    const data = pixels();
    paint(data, 0, 0, [255, 255, 255, 255]);
    paint(data, 1, 0, [255, 0, 0, 199]);
    paint(data, 2, 0, [0, 20, 220, 200]);
    expect(quantizeMaterialPalette(data)).toEqual(['#0014DC']);
  });

  it('ranks a smaller central subject ahead of a larger edge region', () => {
    const data = pixels();
    for (let y = 10; y < 15; y++) for (let x = 10; x < 20; x++) paint(data, x, y, [220, 0, 0, 255]);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 5; x++) paint(data, x, y, [0, 0, 220, 255]);
    expect(quantizeMaterialPalette(data)).toEqual(['#DC0000', '#0000DC']);
  });

  it('weights saturated garment colors above neutral studio tones', () => {
    const data = pixels();
    for (let x = 10; x < 20; x++) {
      paint(data, x, 10, [220, 0, 0, 255]);
      paint(data, x, 11, [160, 160, 160, 255]);
      paint(data, x, 12, [160, 160, 160, 255]);
    }
    expect(quantizeMaterialPalette(data)[0]).toBe('#DC0000');
  });

  it('limits the result to five distinct HEX codes', () => {
    const data = pixels();
    const colors: RGBA[] = [
      [200, 30, 30, 255],
      [220, 30, 30, 255],
      [0, 220, 0, 255],
      [0, 0, 220, 255],
      [220, 220, 0, 255],
      [0, 220, 220, 255],
      [220, 0, 220, 255],
    ];
    colors.forEach((color, index) => paint(data, index + 10, 10, color));
    const palette = quantizeMaterialPalette(data);
    expect(palette).toHaveLength(5);
    expect(palette.every((hex) => /^#[\dA-F]{6}$/.test(hex))).toBe(true);
  });

  it('deduplicates nearby colors from separate quantization buckets', () => {
    const data = pixels();
    paint(data, 10, 10, [200, 30, 30, 255]);
    paint(data, 11, 10, [220, 30, 30, 255]);
    paint(data, 12, 10, [0, 0, 220, 255]);
    const palette = quantizeMaterialPalette(data);
    expect(palette).toHaveLength(2);
    expect(palette.filter((hex) => ['#C81E1E', '#DC1E1E'].includes(hex))).toHaveLength(1);
  });

  it('handles blank, monochrome and incomplete samples without fabricated colors', () => {
    expect(quantizeMaterialPalette(pixels())).toEqual([]);
    expect(quantizeMaterialPalette(new Uint8ClampedArray(4))).toEqual([]);
    const data = pixels();
    paint(data, 10, 10, [0, 0, 0, 255]);
    expect(quantizeMaterialPalette(data)).toEqual(['#000000']);
  });
});

describe('browser palette adapter', () => {
  it('samples only the already-loaded image with a small local canvas', () => {
    const data = pixels();
    paint(data, 10, 10, [10, 20, 30, 255]);
    const drawImage = vi.fn();
    const getImageData = vi.fn(() => ({ data }));
    const context = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage, getImageData } as unknown as CanvasRenderingContext2D);
    const image = loadedImage();
    expect(extractMaterialPalette(image)).toEqual(['#0A141E']);
    expect(context).toHaveBeenCalledWith('2d', { willReadFrequently: true });
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 48, 48);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 48, 48);
  });

  it('returns no palette before image load or when canvas access is unavailable', () => {
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(extractMaterialPalette(null)).toEqual([]);
    expect(extractMaterialPalette(document.createElement('img'))).toEqual([]);
    expect(context).not.toHaveBeenCalled();
    expect(extractMaterialPalette(loadedImage())).toEqual([]);
  });

  it('contains canvas security failures so the material viewer can still work', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => {
        throw new DOMException('Tainted canvas', 'SecurityError');
      },
    } as unknown as CanvasRenderingContext2D);
    expect(extractMaterialPalette(loadedImage())).toEqual([]);
  });
});
