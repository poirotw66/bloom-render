import { describe, expect, it, vi } from 'vitest';
import {
  addMaterialToBasket,
  createMaterialBasketTransfer,
  parseMaterialBasketTransfer,
  validateMaterialBasketIds,
} from './materialBasket';

vi.mock('../constants/tryOnMaterials', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../constants/tryOnMaterials')>();
  const shirt = actual.TRYON_MATERIALS.find((item) => item.role === 'clothing')!;
  return {
    ...actual,
    TRYON_MATERIALS: [
      ...actual.TRYON_MATERIALS,
      ...Array.from({ length: 6 }, (_, index) => ({ ...shirt, id: `fixture-shirt-${index}` })),
    ],
  };
});

describe('material basket transfers', () => {
  it('round-trips ordered catalog identifiers without including other route state', () => {
    const ids = ['pose-seated-profile', 'white-oxford-shirt', 'lighting-soft-window'];
    const transfer = createMaterialBasketTransfer(ids);
    expect(parseMaterialBasketTransfer({ ...transfer, unrelated: 'not stored' })).toEqual(ids);
    ids.reverse();
    expect(transfer.materialBasket.materialIds[0]).toBe('pose-seated-profile');
  });

  it.each([
    null,
    [],
    { materialBasket: { v: 2, materialIds: [] } },
    { materialBasket: { v: 1, materialIds: ['missing'] } },
    { materialBasket: { v: 1, materialIds: ['white-oxford-shirt', 'white-oxford-shirt'] } },
    { materialBasket: { v: 1, materialIds: ['pose-seated-profile', 'pose-relaxed-front'] } },
    { materialBasket: { v: 1, materialIds: [], apiKey: 'not allowed' } },
    { materialBasket: { v: 1, materialIds: [42] } },
  ])('rejects malformed, unknown or incompatible selections', (value) => {
    expect(parseMaterialBasketTransfer(value)).toBeNull();
  });

  it('keeps duplicate additions idempotent', () => {
    const ids = ['white-oxford-shirt'];
    expect(addMaterialToBasket(ids, 'white-oxford-shirt')).toEqual({
      materialIds: ids,
      message: 'already-selected',
    });
    expect(ids).toEqual(['white-oxford-shirt']);
  });

  it('replaces a single-role reference in place and reports that replacement', () => {
    expect(
      addMaterialToBasket(['white-oxford-shirt', 'pose-relaxed-front'], 'pose-seated-profile'),
    ).toEqual({
      materialIds: ['white-oxford-shirt', 'pose-seated-profile'],
      message: 'replaced',
    });
  });

  it('refuses a sixth clothing reference without silently dropping an existing one', () => {
    const ids = Array.from({ length: 5 }, (_, index) => `fixture-shirt-${index}`);
    expect(validateMaterialBasketIds(ids)).toEqual(ids);
    expect(addMaterialToBasket(ids, 'fixture-shirt-5')).toEqual({
      materialIds: ids,
      message: 'clothing-limit',
    });
    expect(validateMaterialBasketIds([...ids, 'fixture-shirt-5'])).toBeNull();
  });
});
