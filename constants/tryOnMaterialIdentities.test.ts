import { describe, expect, it } from 'vitest';
import { TRYON_MATERIALS } from './tryOnMaterials';
import { TRYON_MATERIAL_IDENTITIES } from './tryOnMaterialIdentities';

describe('lightweight material identities', () => {
  it('matches every catalog ID and role without shipping image or prompt fields', () => {
    expect(TRYON_MATERIAL_IDENTITIES).toEqual(
      TRYON_MATERIALS.map(({ id, role }) => ({ id, role })),
    );
  });
});
