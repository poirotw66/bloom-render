import identities from './tryOnMaterialIdentities.json';
import type { TryOnMaterial } from './tryOnMaterials';

/** Small selection index: the app shell does not need every prompt and description. */
export const TRYON_MATERIAL_IDENTITIES = identities as Pick<TryOnMaterial, 'id' | 'role'>[];
