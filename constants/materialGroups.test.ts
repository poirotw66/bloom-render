import { describe, expect, it } from 'vitest';
import { groupMaterials } from './materialGroups';
import { TRYON_MATERIALS } from './tryOnMaterials';

describe('material browsing groups', () => {
  it('presents paired pose studies once while retaining every exact reference', () => {
    const groups = groupMaterials(TRYON_MATERIALS);
    expect(groups).toHaveLength(11);
    expect(groups.flatMap((group) => group.materials.map((material) => material.id))).toHaveLength(
      32,
    );
    const seated = groups.find((group) => group.id.startsWith('seated-study:'))!;
    expect(seated.title).toBe('Seated study');
    expect(seated.titleZh).toBe('坐姿研究');
    expect(seated.materials).toHaveLength(8);
  });

  it('keeps search and favorite subsets exact instead of revealing other variants', () => {
    const favorite = TRYON_MATERIALS.find(
      (material) => material.id === 'seated-study-profile-depth',
    )!;
    expect(groupMaterials([favorite])).toEqual([
      expect.objectContaining({ materials: [favorite] }),
    ]);
    expect(groupMaterials([])).toEqual([]);
  });
});
