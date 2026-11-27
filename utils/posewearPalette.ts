/*!
 * Derived from PoseWear src/palette.js (extract).
 * Copyright (c) 2026 PoseWear contributors. SPDX-License-Identifier: MIT
 * Source: https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/palette.js
 * Adapted to typed pixel quantization and a guarded browser image adapter.
 * Full license: public/licenses/posewear-MIT.txt
 */

const SAMPLE_SIZE = 48;
type RGB = [number, number, number];
interface Bucket {
  w: number;
  r: number;
  g: number;
  b: number;
}

export function quantizeMaterialPalette(data: Uint8ClampedArray): string[] {
  if (data.length !== SAMPLE_SIZE * SAMPLE_SIZE * 4) return [];
  const bucketsMap = new Map<number, Bucket>();
  for (let p = 0; p < SAMPLE_SIZE * SAMPLE_SIZE; p++) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200 || (r > 242 && g > 242 && b > 242)) continue;

    const x = p % SAMPLE_SIZE;
    const y = (p / SAMPLE_SIZE) | 0;
    const centerWeight = x >= 7 && x <= 40 && y >= 4 && y <= 44 ? 1.8 : 0.25;
    const qr = Math.min(240, Math.round(r / 16) * 16);
    const qg = Math.min(240, Math.round(g / 16) * 16);
    const qb = Math.min(240, Math.round(b / 16) * 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    const weight = (0.35 + sat * 4.5) * centerWeight;
    const key = (qr << 16) | (qg << 8) | qb;
    const cur = bucketsMap.get(key);
    if (cur) {
      cur.w += weight;
      cur.r += r * weight;
      cur.g += g * weight;
      cur.b += b * weight;
    } else {
      bucketsMap.set(key, { w: weight, r: r * weight, g: g * weight, b: b * weight });
    }
  }

  const ranked = [...bucketsMap.values()]
    .sort((a, b) => b.w - a.w)
    .map<RGB>((x) => [Math.round(x.r / x.w), Math.round(x.g / x.w), Math.round(x.b / x.w)]);
  const chosen: RGB[] = [];
  for (const rgb of ranked) {
    if (
      chosen.every(
        (other) => Math.hypot(other[0] - rgb[0], other[1] - rgb[1], other[2] - rgb[2]) >= 44,
      )
    ) {
      chosen.push(rgb);
      if (chosen.length >= 5) break;
    }
  }
  return chosen.map(
    (rgb) =>
      '#' +
      rgb
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase(),
  );
}

export function extractMaterialPalette(image: HTMLImageElement | null): string[] {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return [];
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return [];
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return quantizeMaterialPalette(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
  } catch {
    return [];
  }
}
