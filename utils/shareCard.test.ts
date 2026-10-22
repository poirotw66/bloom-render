/**
 * @license
 * SPDX-License-Identifier: MIT
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FOOTER_TEXT, QR_DARK, QR_LIGHT, SITE_URL } from './shareCard';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async () => 'data:image/png;base64,mockqr'),
  },
}));

describe('shareCard constants', () => {
  it('exposes brand footer and site URL', () => {
    expect(FOOTER_TEXT).toContain('BloomRender');
    expect(SITE_URL).toMatch(/^https:\/\//);
  });

  it('uses dark-on-light QR colors for scan reliability', () => {
    expect(QR_LIGHT.toLowerCase()).toBe('#ffffff');
    expect(QR_DARK.toLowerCase()).not.toBe('#ffffff');
  });
});

describe('drawRemixQr', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('draws a quiet-zone backed QR into the footer', async () => {
    // Stub Image so loadImage resolves without a real decode.
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 64;
      height = 64;
      naturalWidth = 64;
      naturalHeight = 64;
      set src(_v: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', MockImage);

    const { drawRemixQr } = await import('./shareCard');
    const QRCode = (await import('qrcode')).default;

    const calls: Array<{ op: string; args: unknown[] }> = [];
    const ctx = {
      fillStyle: '',
      fillRect: (...args: unknown[]) => calls.push({ op: 'fillRect', args }),
      drawImage: (...args: unknown[]) => calls.push({ op: 'drawImage', args }),
    } as unknown as CanvasRenderingContext2D;

    await drawRemixQr(ctx, 'https://www.bloss0m.com/bloom-render/r#abc', {
      x: 0,
      y: 972,
      width: 1080,
      height: 108,
    });

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'https://www.bloss0m.com/bloom-render/r#abc',
      expect.objectContaining({
        color: { dark: QR_DARK, light: QR_LIGHT },
      }),
    );

    const fill = calls.find((c) => c.op === 'fillRect');
    const draw = calls.find((c) => c.op === 'drawImage');
    expect(fill).toBeTruthy();
    expect(draw).toBeTruthy();

    // Quiet zone: fillRect outer > drawImage size; QR sits bottom-right.
    const [, , outerW] = fill!.args as number[];
    const [, , , , qrSize] = draw!.args as [unknown, number, number, number, number];
    expect(outerW).toBeGreaterThan(qrSize);
    const [qx] = fill!.args as number[];
    expect(qx).toBeGreaterThan(1080 / 2);
  });
});
