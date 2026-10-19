/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { extensionForFormat, withExtension } from './imageExport';

describe('imageExport helpers', () => {
  it('maps formats to extensions', () => {
    expect(extensionForFormat('png')).toBe('png');
    expect(extensionForFormat('jpeg')).toBe('jpg');
    expect(extensionForFormat('webp')).toBe('webp');
  });

  it('replaces existing extensions', () => {
    expect(withExtension('photo.png', 'jpeg')).toBe('photo.jpg');
    expect(withExtension('photo', 'webp')).toBe('photo.webp');
  });
});
