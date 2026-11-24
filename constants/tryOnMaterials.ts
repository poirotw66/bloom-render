import materials from './tryOnMaterials.json';
import type { TryOnReferenceRole } from '../types/tryOnRecipe';

export interface TryOnMaterial {
  id: string;
  role: TryOnReferenceRole;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  image: string;
  prompt: string;
  license: 'CC0-1.0';
  source: string;
}

export const TRYON_MATERIALS: TryOnMaterial[] = materials as TryOnMaterial[];
