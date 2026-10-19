/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Minimal single-page PDF writer that embeds one JPEG image.
 * No external PDF dependency — suitable for print-sheet export.
 */

function enc(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Wrap JPEG bytes as a one-page PDF. `widthPx`/`heightPx` are the raster size;
 * page size in PDF points uses `dpi` (default 300).
 */
export function jpegBytesToSinglePagePdf(
  jpeg: Uint8Array,
  widthPx: number,
  heightPx: number,
  dpi: number = 300,
): Uint8Array {
  const pageW = (widthPx * 72) / dpi;
  const pageH = (heightPx * 72) / dpi;

  const objects: Uint8Array[] = [];
  const offsets: number[] = [];

  const pushObject = (body: string | Uint8Array) => {
    offsets.push(objects.reduce((n, c) => n + c.length, 0));
    if (typeof body === 'string') {
      objects.push(enc(body));
    } else {
      objects.push(body);
    }
  };

  // Header written separately so xref offsets start after it.
  const header = enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  pushObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // Object 2: Pages
  pushObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  // Object 3: Page
  pushObject(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`,
  );
  // Object 4: Content stream
  const content = `q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  pushObject(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
  // Object 5: Image XObject + stream
  const imgDict = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`;
  const imgEnd = enc('\nendstream\nendobj\n');
  pushObject(concat([enc(imgDict), jpeg, imgEnd]));

  const body = concat(objects);
  const xrefStart = header.length + body.length;

  let xref = `xref\n0 ${offsets.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (const off of offsets) {
    const abs = header.length + off;
    xref += `${String(abs).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return concat([header, body, enc(xref), enc(trailer)]);
}
