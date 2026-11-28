import { describe, expect, it } from 'vitest';
import {
  CLOTHING_CATEGORIES,
  isValidMaterialClothing,
  parseClothingMetadata,
  getClothingCategoryLabel,
  getClothingSearchText,
  matchesClothingCategory,
} from './clothingMetadata.mjs';
import { TRYON_MATERIALS } from './tryOnMaterials';

describe('clothing category metadata', () => {
  it.each(CLOTHING_CATEGORIES)(
    'accepts the category %s and returns an independent record',
    (category) => {
      const input = { category };
      expect(parseClothingMetadata(input)).toEqual(input);
      expect(parseClothingMetadata(input)).not.toBe(input);
    },
  );
  it.each([
    null,
    [],
    {},
    { category: 'unknown' },
    { category: 'top', extra: true },
    Object.create({ category: 'top' }),
  ])('rejects malformed metadata %j', (value) => {
    expect(parseClothingMetadata(value)).toBeNull();
  });
  it('requires category only on clothing catalog records', () => {
    expect(TRYON_MATERIALS.every(isValidMaterialClothing)).toBe(true);
    expect(isValidMaterialClothing({ role: 'clothing' })).toBe(false);
    expect(isValidMaterialClothing({ role: 'pose', clothing: { category: 'top' } })).toBe(false);
  });
  it('uses readable bilingual category vocabulary without leaking it to other roles', () => {
    const pants = TRYON_MATERIALS.find((item) => item.id === 'indigo-straight-jeans')!;
    const pose = TRYON_MATERIALS.find((item) => item.role === 'pose')!;
    expect(getClothingCategoryLabel('trousers', 'zh-TW')).toBe('褲裝');
    expect(getClothingCategoryLabel('trousers')).toBe('Pants');
    expect(getClothingSearchText(pants)).toContain('褲子');
    expect(getClothingSearchText(pose)).toBe('');
    expect(matchesClothingCategory(pants, 'trousers')).toBe(true);
    expect(matchesClothingCategory(pants, 'dress')).toBe(false);
    expect(matchesClothingCategory(pose, 'trousers')).toBe(false);
    expect(matchesClothingCategory(pose)).toBe(true);
  });
});
