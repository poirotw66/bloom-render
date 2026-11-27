import materials from './tryOnMaterials.json';
import { isValidMaterialPose, type PoseMetadata } from './poseMetadata.mjs';
import { validatePoseReferences, type PoseReference } from './poseReferences.mjs';
import type { TryOnReferenceRole } from '../types/tryOnRecipe';
import { isValidMaterialClothing, type ClothingMetadata } from './clothingMetadata.mjs';

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
  poseReference?: PoseReference;
  clothing?: ClothingMetadata;
  license: 'CC0-1.0' | 'LicenseRef-AI-Generated';
  source: string;
}

if (!materials.every(isValidMaterialPose))
  throw new Error('Invalid pose metadata in the material catalog.');
if (!materials.every(isValidMaterialClothing))
  throw new Error('Invalid clothing metadata in the material catalog.');

export const TRYON_MATERIALS: TryOnMaterial[] = materials as TryOnMaterial[];
const pairErrors = validatePoseReferences(TRYON_MATERIALS);
if (pairErrors.length) throw new Error(pairErrors.join('\n'));
