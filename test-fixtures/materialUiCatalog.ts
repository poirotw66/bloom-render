import type { TryOnMaterial } from '../constants/tryOnMaterials';

// UI behavior tests retain every pose variant and garment category, plus four full outfits.
// Full catalog integrity and real browser workflows use the complete production catalog.
export function materialUiCatalog(materials: TryOnMaterial[]): TryOnMaterial[] {
  let outfits = 0;
  return materials.filter((material) => material.clothing?.category !== 'outfit' || outfits++ < 4);
}
