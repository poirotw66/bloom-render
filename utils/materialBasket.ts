import { TRYON_MATERIAL_IDENTITIES } from '../constants/tryOnMaterialIdentities';
import { DEFAULT_TRYON_BACKGROUND, DEFAULT_TRYON_STYLE } from '../constants/tryOn';
import type { TryOnRecipe } from '../types/tryOnRecipe';

const materialsById = new Map(TRYON_MATERIAL_IDENTITIES.map((material) => [material.id, material]));

export const MATERIAL_BASKET_STORAGE_KEY = 'bloom_material_basket';
export type MaterialBasketMessage =
  | 'added'
  | 'removed'
  | 'cleared'
  | 'restored'
  | 'reference-conflict'
  | 'already-selected'
  | 'replaced'
  | 'clothing-limit'
  | 'invalid-material'
  | 'invalid-saved-basket'
  | 'storage-unavailable'
  | null;

export interface MaterialBasketTransfer {
  materialBasket: { v: 1; materialIds: string[] };
}

export function validateMaterialBasketIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 9 || new Set(value).size !== value.length)
    return null;
  const roles = new Map<string, number>();
  for (const id of value) {
    if (typeof id !== 'string') return null;
    const material = materialsById.get(id);
    if (!material) return null;
    const count = (roles.get(material.role) ?? 0) + 1;
    if (count > (material.role === 'clothing' ? 5 : 1)) return null;
    roles.set(material.role, count);
  }
  return [...value] as string[];
}

export function parseMaterialBasketTransfer(state: unknown): string[] | null {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  const basket = (state as Record<string, unknown>).materialBasket;
  if (!basket || typeof basket !== 'object' || Array.isArray(basket)) return null;
  const data = basket as Record<string, unknown>;
  if (Object.keys(data).some((key) => !['v', 'materialIds'].includes(key)) || data.v !== 1)
    return null;
  return validateMaterialBasketIds(data.materialIds);
}

export function createMaterialBasketTransfer(materialIds: string[]): MaterialBasketTransfer {
  const valid = validateMaterialBasketIds(materialIds);
  if (!valid) throw new Error('Invalid material selection');
  return { materialBasket: { v: 1, materialIds: valid } };
}

export function createMaterialBasketTryOnRecipe(materialIds: string[]): TryOnRecipe {
  const valid = validateMaterialBasketIds(materialIds);
  if (!valid?.length) throw new Error('Choose at least one valid material');
  return {
    v: 1,
    kind: 'tryon',
    materialIds: valid,
    settings: {
      background: DEFAULT_TRYON_BACKGROUND,
      style: DEFAULT_TRYON_STYLE,
      outputSize: '1K',
      aspectRatio: '9:16',
      quantity: 1,
      keepBackground: true,
      keepPose: true,
    },
  };
}

export function addMaterialToBasket(materialIds: string[], id: string) {
  const material = materialsById.get(id);
  if (!material) return { materialIds, message: 'invalid-material' as const };
  if (materialIds.includes(id)) return { materialIds, message: 'already-selected' as const };
  const sameRole = materialIds.filter(
    (selected) => materialsById.get(selected)?.role === material.role,
  );
  if (material.role === 'clothing' && sameRole.length >= 5)
    return { materialIds, message: 'clothing-limit' as const };
  if (material.role !== 'clothing' && sameRole.length) {
    return {
      materialIds: materialIds.map((selected) => (selected === sameRole[0] ? id : selected)),
      message: 'replaced' as const,
    };
  }
  return { materialIds: [...materialIds, id], message: 'added' as const };
}

export function addMaterialsToBasket(materialIds: string[], additions: string[]) {
  const union = [...new Set([...materialIds, ...additions])];
  const materials = union.map((id) => materialsById.get(id));
  if (materials.some((item) => !item))
    return { materialIds, message: 'invalid-material' as const, ok: false };
  if (materials.filter((item) => item!.role === 'clothing').length > 5)
    return { materialIds, message: 'clothing-limit' as const, ok: false };
  if (!validateMaterialBasketIds(union))
    return { materialIds, message: 'reference-conflict' as const, ok: false };
  if (union.length === materialIds.length)
    return { materialIds, message: 'already-selected' as const, ok: true };
  return { materialIds: union, message: 'added' as const, ok: true };
}

export function materialBasketMessage(message: MaterialBasketMessage, zh: boolean): string {
  const copy = {
    added: ['素材已加入。', 'Material added.'],
    removed: ['素材已移除。', 'Material removed.'],
    cleared: ['素材籃已清空。', 'Basket cleared.'],
    restored: ['已復原清空的素材。', 'Cleared materials restored.'],
    'reference-conflict': [
      '每種參考類型只能選一張，請先移除衝突素材。',
      'Choose only one reference of each type. Remove conflicting materials first.',
    ],
    'already-selected': ['這個素材已在素材籃中。', 'This material is already in your basket.'],
    replaced: ['已替換素材籃中同類型的參考圖。', 'Replaced the selected reference of this type.'],
    'clothing-limit': [
      '最多可選五張服裝參考圖，請先移除一張。',
      'Choose up to five clothing references. Remove one before adding another.',
    ],
    'invalid-material': ['這個素材目前無法使用。', 'This material is unavailable.'],
    'invalid-saved-basket': [
      '已重設無法讀取的素材籃，請重新挑選。',
      'The saved basket could not be restored. Choose your materials again.',
    ],
    'storage-unavailable': [
      '素材籃可繼續使用，但目前無法儲存到此裝置。',
      'You can keep using the basket, but it cannot be saved on this device.',
    ],
  };
  return message ? copy[message][zh ? 0 : 1]! : '';
}
