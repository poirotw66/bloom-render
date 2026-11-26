import materials from './tryOnMaterials.json';
import { isValidMaterialPose, type PoseMetadata } from './poseMetadata.mjs';
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
  pose?: PoseMetadata;
  license: 'CC0-1.0';
  source: string;
}

if (!materials.every(isValidMaterialPose))
  throw new Error('Invalid pose metadata in the material catalog.');

export const TRYON_MATERIALS: TryOnMaterial[] = materials as TryOnMaterial[];
