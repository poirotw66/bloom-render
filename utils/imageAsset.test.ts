import { describe, expect, it } from 'vitest';
import { mimeTypeForImagePath, referenceFileName } from './imageAsset';

describe('imageAsset', () => {
  it('maps webp paths to image/webp', () => {
    expect(mimeTypeForImagePath('/images/scenes/eiffel.webp')).toBe('image/webp');
  });

  it('builds ref filename from scene path extension', () => {
    expect(referenceFileName('eiffel', '/images/scenes/eiffel.webp')).toBe('eiffel_ref.webp');
  });
});
