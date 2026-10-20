/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { blobToDataUrl, isUsableImageSource, rgbaBufferToPngDataUrl } from './imageIO';

describe('isUsableImageSource', () => {
  it('accepts data/blob/http(s) URLs', () => {
    expect(isUsableImageSource('data:image/png;base64,aa')).toBe(true);
    expect(isUsableImageSource('blob:https://x/1')).toBe(true);
    expect(isUsableImageSource('https://example.com/a.png')).toBe(true);
    expect(isUsableImageSource('http://example.com/a.png')).toBe(true);
    expect(isUsableImageSource('/relative.png')).toBe(false);
  });
});

describe('blobToDataUrl', () => {
  it('reads a blob as a data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const url = await blobToDataUrl(blob);
    expect(url.startsWith('data:text/plain;base64,')).toBe(true);
  });
});

describe('rgbaBufferToPngDataUrl', () => {
  it('rejects bad inputs without needing canvas', () => {
    expect(() => rgbaBufferToPngDataUrl(new Uint8Array([1]), 0, 1, 3)).toThrow(/dimensions/);
    expect(() => rgbaBufferToPngDataUrl(new Uint8Array([1]), 1, 1, 2)).toThrow(/channel/);
    expect(() => rgbaBufferToPngDataUrl(new Uint8Array([1]), 1, 1, 3)).toThrow(/too small/);
  });

  it('exports PNG data URLs when canvas 2D is available', () => {
    const proto = HTMLCanvasElement.prototype;
    const originalGetContext = proto.getContext;
    const originalToDataURL = proto.toDataURL;
    const pixels = new Uint8ClampedArray(4);

    // jsdom lacks a real 2D context; stub just enough for the helper.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (proto as any).getContext = () => ({
      createImageData: () => ({ data: pixels, width: 1, height: 1 }),
      putImageData: () => undefined,
    });
    proto.toDataURL = () => 'data:image/png;base64,TEST';

    try {
      expect(rgbaBufferToPngDataUrl(new Uint8Array([10, 20, 30]), 1, 1, 3)).toBe(
        'data:image/png;base64,TEST',
      );
      expect(rgbaBufferToPngDataUrl(new Uint8ClampedArray([1, 2, 3, 255]), 1, 1, 4)).toBe(
        'data:image/png;base64,TEST',
      );
    } finally {
      proto.getContext = originalGetContext;
      proto.toDataURL = originalToDataURL;
    }
  });
});
