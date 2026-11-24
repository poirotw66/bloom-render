import { logger } from '../../utils/logger';
import { runImageGeneration } from './runImageGeneration';
import { supportsMultiResolution, type ServiceSettings } from './shared';
import { generateTryOnPrompt } from './prompts/tryOn';
import {
  TRYON_OPTIONAL_REFERENCE_ROLES,
  type TryOnOptionalReferenceRole,
} from '../../types/tryOnRecipe';

export interface GenerateTryOnOptions {
  settings?: ServiceSettings;
  variationIndex?: number;
  backgroundHint?: string;
  styleHint?: string;
  outputSize?: '1K' | '2K' | '4K';
  aspectRatio?: '1:1' | '16:9' | '9:16';
  keepBackground?: boolean;
  keepPose?: boolean;
  referenceFiles?: Partial<Record<TryOnOptionalReferenceRole, File>>;
  referenceHints?: Partial<Record<TryOnOptionalReferenceRole, string>>;
}

export function prepareTryOnRequest(
  personImage: File,
  clothingImages: File[],
  options: GenerateTryOnOptions = {},
) {
  const referenceRoles = TRYON_OPTIONAL_REFERENCE_ROLES.filter(
    (role) => options.referenceFiles?.[role],
  );
  const prompt = generateTryOnPrompt({
    ...options,
    clothingCount: clothingImages.length,
    referenceRoles,
  });
  const images = [
    personImage,
    ...clothingImages,
    ...referenceRoles.map((role) => options.referenceFiles![role]!),
  ];
  const supportsMultiRes = supportsMultiResolution(options.settings?.model);
  const effectiveSize = supportsMultiRes ? (options.outputSize ?? '1K') : '1K';
  return {
    prompt,
    images,
    effectiveSize,
    aspectRatio: options.aspectRatio ?? '9:16',
    imageSize: supportsMultiRes ? effectiveSize : undefined,
    includeImageConfig: true,
    context: 'try-on',
  };
}

export const generateVirtualTryOn = async (
  personImage: File,
  clothingImages: File[],
  options: GenerateTryOnOptions = {},
): Promise<string> => {
  const prepared = prepareTryOnRequest(personImage, clothingImages, options);
  logger.debug('Starting virtual try-on generation', {
    clothingCount: clothingImages.length,
    referenceCount: prepared.images.length,
    outputSize: prepared.effectiveSize,
    aspectRatio: prepared.aspectRatio,
  });
  return runImageGeneration({ ...prepared, settings: options.settings });
};
