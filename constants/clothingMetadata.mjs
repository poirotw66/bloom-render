export const CLOTHING_CATEGORIES = Object.freeze([
  'top',
  'trousers',
  'skirt',
  'outerwear',
  'dress',
]);

const CATEGORY_LABELS = {
  top: ['Tops', '上衣'],
  trousers: ['Pants', '褲裝'],
  skirt: ['Skirts', '裙裝'],
  outerwear: ['Outerwear', '外套'],
  dress: ['Dresses', '洋裝'],
};
const CATEGORY_ALIASES = {
  top: 'top tops 上衣',
  trousers: 'pants trousers 褲裝 褲子',
  skirt: 'skirt skirts 裙裝 裙子 半身裙',
  outerwear: 'outerwear 外套 外衣',
  dress: 'dress dresses 洋裝 連身裙 連衣裙',
};

/** @param {string} category @param {string} [language] */
export function getClothingCategoryLabel(category, language = 'en') {
  return CATEGORY_LABELS[category]?.[language === 'zh-TW' ? 1 : 0] ?? category;
}

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

/** @param {{role:string,clothing?:unknown}} material @param {string} [category] */
export function matchesClothingCategory(material, category = '') {
  return (
    !category ||
    (material.role === 'clothing' &&
      parseClothingMetadata(material.clothing)?.category === category)
  );
}

/** Category vocabulary is shared by the browser and read-only MCP search. */
/** @param {{role:string,clothing?:unknown}} material */
export function getClothingSearchText(material) {
  if (material.role !== 'clothing') return '';
  const category = parseClothingMetadata(material.clothing)?.category;
  return category
    ? `${getClothingCategoryLabel(category)} ${getClothingCategoryLabel(category, 'zh-TW')} ${CATEGORY_ALIASES[category]}`
    : '';
}
