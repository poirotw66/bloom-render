/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  mimeTypeForImagePath,
  referenceFileName,
  sceneImageBasename,
  sceneRefPath,
  sceneThumbPath,
} from './imageAsset';

describe('imageAsset', () => {
  it('resolves mime types from path extensions', () => {
    expect(mimeTypeForImagePath('/images/scenes/eiffel.webp')).toBe('image/webp');
    expect(mimeTypeForImagePath('/images/foo.PNG')).toBe('image/png');
  });

  it('builds API upload filenames from scene ids', () => {
    expect(referenceFileName('eiffel', '/images/scenes/eiffel.webp')).toBe('eiffel_ref.webp');
  });

  it('derives thumb and capped-ref paths from catalog reference paths', () => {
    const catalog = '/images/scenes/eiffel.webp';
    expect(sceneImageBasename(catalog)).toBe('eiffel');
    expect(sceneThumbPath(catalog)).toBe('/images/scenes/thumbs/256/eiffel.webp');
    expect(sceneThumbPath(catalog, 512)).toBe('/images/scenes/thumbs/512/eiffel.webp');
    expect(sceneRefPath(catalog)).toBe('/images/scenes/ref/eiffel.webp');
  });
});
