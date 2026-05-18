import { describe, expect, it } from 'vitest';
import { publicAssetUrl } from './publicAsset';

describe('publicAssetUrl', () => {
  it('prefixes paths with Vite BASE_URL', () => {
    const base = import.meta.env.BASE_URL || '/';
    expect(publicAssetUrl('/images/scenes/venice.webp')).toBe(`${base}images/scenes/venice.webp`);
  });

  it('accepts paths without leading slash', () => {
    const base = import.meta.env.BASE_URL || '/';
    expect(publicAssetUrl('images/world-map.webp')).toBe(`${base}images/world-map.webp`);
  });
});
