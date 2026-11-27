import { describe, expect, it } from 'vitest';
import { groupMaterials } from './materialGroups';
import { POSE_STUDIES } from './poseStudies.mjs';
import { TRYON_MATERIALS } from './tryOnMaterials';

describe('material browsing groups', () => {
  it('presents paired pose studies once while retaining every exact reference', () => {
    const groups = groupMaterials(TRYON_MATERIALS);
    expect(groups).toHaveLength(
      TRYON_MATERIALS.filter((material) => !material.poseReference).length + POSE_STUDIES.length,
    );
    expect(
      groups.flatMap((group) => group.materials.map((material) => material.id)).sort(),
    ).toEqual(TRYON_MATERIALS.map((material) => material.id).sort());
    for (const study of POSE_STUDIES)
      expect(groups.find((group) => group.id.startsWith(`${study.id}:`))?.materials).toHaveLength(
        8,
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
