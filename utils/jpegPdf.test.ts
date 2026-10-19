/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { jpegBytesToSinglePagePdf } from './jpegPdf';

describe('jpegBytesToSinglePagePdf', () => {
  it('emits a PDF header, xref, and EOF around the JPEG', () => {
    // Minimal valid-enough JPEG payload for embedding (not decodable, but structured).
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 1, 2, 3, 4]);
    const pdf = jpegBytesToSinglePagePdf(jpeg, 100, 150, 300);
    const asText = String.fromCharCode(...pdf.subarray(0, 8));
    expect(asText.startsWith('%PDF-')).toBe(true);
    const full = Array.from(pdf)
      .map((b) => String.fromCharCode(b))
      .join('');
    expect(full).toContain('/Subtype /Image');
    expect(full).toContain('/Filter /DCTDecode');
    expect(full).toContain('%%EOF');
    expect(full).toContain('startxref');
  });
});
