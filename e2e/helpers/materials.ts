import { readFileSync } from 'node:fs';
import { groupMaterials } from '../../constants/materialGroups';
import type { TryOnMaterial } from '../../constants/tryOnMaterials';

const materials: TryOnMaterial[] = JSON.parse(
  readFileSync(new URL('../../constants/tryOnMaterials.json', import.meta.url), 'utf8'),
);
export const MATERIAL_GROUP_COUNT = groupMaterials(materials).length;
