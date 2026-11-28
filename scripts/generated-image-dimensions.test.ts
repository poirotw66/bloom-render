import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generatedImageDimensions } from './generated-image-dimensions.mjs';

describe('reviewed raster encodings', () => {
  it.each([
    ['white-crew-neck-tee.png', 'png'],
    ['pose-full-single-p018.webp', 'webp'],
    ['outfit-swm-0027.webp', 'webp'],
  ])('reads real generated %s dimensions', (file, format) => {
    const bytes = readFileSync(
      new URL(`../public/images/tryon-materials/${file}`, import.meta.url),
    );
    expect(generatedImageDimensions(bytes, format)).toEqual({ width: 1024, height: 1024 });
    expect(generatedImageDimensions(bytes, format === 'png' ? 'webp' : 'png')).toBeNull();
  });
  it('rejects a truncated or malformed WebP container', () => {
    const bytes = readFileSync(
      new URL('../public/images/tryon-materials/pose-full-single-p018.webp', import.meta.url),
    );
    expect(generatedImageDimensions(bytes.subarray(0, 24), 'webp')).toBeNull();
    const changed = Buffer.from(bytes);
    changed.writeUInt32LE(12, 4);
    expect(generatedImageDimensions(changed, 'webp')).toBeNull();
  });
});
