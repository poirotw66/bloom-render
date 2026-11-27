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
      expect(['CC0-1.0', 'LicenseRef-AI-Generated']).toContain(material.license);
      expect(material.source).toMatch(/^https:\/\/github.com\/poirotw66\/bloom-render\//);
      if (material.poseReference || material.license === 'LicenseRef-AI-Generated') {
        expect(material.image).toBe(`images/tryon-materials/${material.id}.png`);
        const png = readFileSync(new URL(`../public/${material.image}`, import.meta.url));
        expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        expect(png.readUInt32BE(16)).toBeGreaterThan(0);
        expect(png.readUInt32BE(20)).toBeGreaterThan(0);
        if (material.license === 'LicenseRef-AI-Generated') {
          expect(material.role).toBe('clothing');
          expect(png.readUInt32BE(16)).toBe(1024);
          expect(png.readUInt32BE(20)).toBe(1024);
          expect(material.source).toContain('clothing-generation-manifest.json');
        }
        continue;
      }
      expect(material.image).toBe(`images/tryon-materials/${material.id}.svg`);
      const svg = readFileSync(new URL(`../public/${material.image}`, import.meta.url), 'utf8');
      expect(svg).toContain('viewBox="0 0 480 640"');
      expect(svg).toContain('<title');
      expect(svg).toContain('CC0-1.0');
      expect(svg).not.toMatch(/(?:href|src)="https?:/);
    }
  });
});
