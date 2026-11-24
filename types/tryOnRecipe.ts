import {
  TRYON_BACKGROUNDS,
  TRYON_STYLES,
  type TryOnBackgroundId,
  type TryOnStyleId,
} from '../constants/tryOn';

export type TryOnReferenceRole = 'clothing' | 'pose' | 'expression' | 'scene' | 'lighting';
export type TryOnOptionalReferenceRole = Exclude<TryOnReferenceRole, 'clothing'>;

export const TRYON_OPTIONAL_REFERENCE_ROLES: readonly TryOnOptionalReferenceRole[] = [
  'pose',
  'expression',
  'scene',
  'lighting',
];

export interface HistoryReference {
  role: TryOnReferenceRole;
  blob: Blob;
  name: string;
  materialId?: string;
}

export interface TryOnRecipe {
  v: 1;
  kind: 'tryon';
  materialIds: string[];
  settings: {
    background: TryOnBackgroundId;
    style: TryOnStyleId;
    outputSize: '1K' | '2K' | '4K';
    aspectRatio: '1:1' | '16:9' | '9:16';
    quantity: number;
    keepBackground: boolean;
    keepPose: boolean;
  };
}

const RECIPE_KEYS = new Set(['v', 'kind', 'materialIds', 'settings']);
const SETTING_KEYS = new Set([
  'background',
  'style',
  'outputSize',
  'aspectRatio',
  'quantity',
  'keepBackground',
  'keepPose',
]);

export function parseTryOnRecipe(value: unknown): TryOnRecipe | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !RECIPE_KEYS.has(key))) return null;
  if (data.v !== 1 || data.kind !== 'tryon') return null;
  if (!Array.isArray(data.materialIds) || data.materialIds.length > 9) return null;
  if (
    data.materialIds.some(
      (id) => typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 64,
    )
  )
    return null;
  if (new Set(data.materialIds).size !== data.materialIds.length) return null;
  if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings))
    return null;
  const settings = data.settings as Record<string, unknown>;
  if (Object.keys(settings).some((key) => !SETTING_KEYS.has(key))) return null;
  if (!TRYON_BACKGROUNDS.some((item) => item.id === settings.background)) return null;
  if (!TRYON_STYLES.some((item) => item.id === settings.style)) return null;
  if (!['1K', '2K', '4K'].includes(settings.outputSize as string)) return null;
  if (!['1:1', '16:9', '9:16'].includes(settings.aspectRatio as string)) return null;
  if (
    typeof settings.quantity !== 'number' ||
    !Number.isInteger(settings.quantity) ||
    settings.quantity < 1 ||
    settings.quantity > 4
  )
    return null;
  if (typeof settings.keepBackground !== 'boolean' || typeof settings.keepPose !== 'boolean')
    return null;
  return {
    v: 1,
    kind: 'tryon',
    materialIds: [...data.materialIds] as string[],
    settings: { ...settings } as TryOnRecipe['settings'],
  };
}
