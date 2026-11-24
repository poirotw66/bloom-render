import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRYON_MATERIALS } from './tryOnMaterials';

describe('try-on reference library', () => {
  it('ships original, attributed visual references for clothing, pose and lighting', () => {
    const ids = new Set(TRYON_MATERIALS.map((material) => material.id));
    expect(ids.size).toBe(TRYON_MATERIALS.length);
    expect(new Set(TRYON_MATERIALS.map((material) => material.role))).toEqual(
      new Set(['clothing', 'pose', 'lighting']),
    );
    for (const material of TRYON_MATERIALS) {
      expect(material.titleZh).not.toBe(material.title);
      expect(material.prompt).toBeTruthy();
      expect(material.license).toBe('CC0-1.0');
      expect(material.source).toMatch(/^https:\/\/github.com\/poirotw66\/bloom-render\//);
      expect(material.image).toBe(`images/tryon-materials/${material.id}.svg`);
      const svg = readFileSync(new URL(`../public/${material.image}`, import.meta.url), 'utf8');
      expect(svg).toContain('viewBox="0 0 480 640"');
      expect(svg).toContain('<title');
      expect(svg).toContain('CC0-1.0');
      expect(svg).not.toMatch(/(?:href|src)="https?:/);
    }
  });
});
