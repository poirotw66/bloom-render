import { describe, expect, it } from 'vitest';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { similarMaterials } from './posewearSimilarMaterials';

describe('structured material recommendations', () => {
  it('prioritizes the exact pose pair before other cameras and excludes unrelated roles', () => {
    const material = TRYON_MATERIALS.find((entry) => entry.id === 'seated-study-back-depth')!;
    const recommended = similarMaterials(material, TRYON_MATERIALS);
    expect(recommended[0].id).toBe('seated-study-back-lineart');
    expect(recommended).toHaveLength(4);
    expect(recommended.every((entry) => entry.role === 'pose' && entry.id !== material.id)).toBe(
      true,
    );
    expect(recommended.every((entry) => entry.pose?.groupId === 'seated-study')).toBe(true);
    expect(similarMaterials(material, TRYON_MATERIALS)).toEqual(recommended);
  });
  it('keeps clothing suggestions within the actual local clothing catalog without inventing metadata', () => {
    const material = TRYON_MATERIALS[0];
    expect(similarMaterials(material, TRYON_MATERIALS).map((entry) => entry.id)).toEqual([
      'navy-tailored-jacket',
      'terracotta-midi-dress',
    ]);
    expect(similarMaterials(material, [material])).toEqual([]);
  });
});
