import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRYON_MATERIALS } from './tryOnMaterials';
import { GENERATED_MATERIAL_BATCHES } from './generatedMaterialBatches.mjs';
import { GENERATED_REFERENCE_BATCH } from './generatedReferenceBatch.mjs';
import { generatedImageDimensions } from '../scripts/generated-image-dimensions.mjs';

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
      if (material.license === 'LicenseRef-AI-Generated') {
        const batch = GENERATED_MATERIAL_BATCHES.find((entry) =>
          Object.hasOwn(entry.entries, material.id),
        );
        expect(batch).toBeDefined();
        const format = batch!.imageFormat ?? 'png';
        expect(material.image).toBe(`images/tryon-materials/${material.id}.${format}`);
        const bytes = readFileSync(new URL(`../public/${material.image}`, import.meta.url));
        expect(generatedImageDimensions(bytes, format)).toEqual({ width: 1024, height: 1024 });
        expect(['clothing', 'pose']).toContain(material.role);
        expect(material.source).toBe(batch!.source);
        if (material.role === 'pose') expect(material.poseReference).toBeUndefined();
        continue;
      }
      if (material.poseReference) {
        expect(material.image).toBe(`images/tryon-materials/${material.id}.png`);
        const png = readFileSync(new URL(`../public/${material.image}`, import.meta.url));
        expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        expect(png.readUInt32BE(16)).toBeGreaterThan(0);
        expect(png.readUInt32BE(20)).toBeGreaterThan(0);
        expect(png.readUInt32BE(16)).toBe(512);
        expect(png.readUInt32BE(20)).toBe(640);
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
  it('ships all approved generated garments and single-view poses under their own provenance', () => {
    const generated = TRYON_MATERIALS.filter(
      (material) => material.license === 'LicenseRef-AI-Generated',
    );
    expect(generated).toHaveLength(
      GENERATED_MATERIAL_BATCHES.reduce(
        (count, batch) => count + Object.keys(batch.entries).length,
        0,
      ),
    );
    const additions = TRYON_MATERIALS.filter((material) =>
      Object.hasOwn(GENERATED_REFERENCE_BATCH, material.id),
    );
    expect(additions).toHaveLength(60);
    expect(additions.filter((material) => material.role === 'clothing')).toHaveLength(36);
    expect(additions.filter((material) => material.role === 'pose')).toHaveLength(24);
    for (const material of additions) {
      expect(material.poseReference).toBeUndefined();
      expect(material.prompt).not.toMatch(/create.*(?:flat lay|pose-reference study)/i);
    }
  });
});
