export const CLOTHING_CATEGORIES = Object.freeze([
  'top',
  'trousers',
  'skirt',
  'outerwear',
  'dress',
]);

/** @typedef {{category:'top'|'trousers'|'skirt'|'outerwear'|'dress'}} ClothingMetadata */

/** @param {unknown} value @returns {ClothingMetadata|null} */
export function parseClothingMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = /** @type {Record<string, unknown>} */ (value);
  if (
    Object.keys(record).length !== 1 ||
    !Object.hasOwn(record, 'category') ||
    typeof record.category !== 'string' ||
    !CLOTHING_CATEGORIES.includes(record.category)
  )
    return null;
  return /** @type {ClothingMetadata} */ ({ category: record.category });
}

/** @param {{role:string,clothing?:unknown}} material */
export function isValidMaterialClothing(material) {
  return material.role === 'clothing'
    ? parseClothingMetadata(material.clothing) !== null
    : material.clothing === undefined;
}
