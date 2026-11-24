import { buildPrompt, IDENTITY_PRESERVATION, QUALITY_REQUIREMENTS } from './base';
import type { TryOnOptionalReferenceRole } from '../../../types/tryOnRecipe';

export interface TryOnPromptOptions {
  clothingCount: number;
  variationIndex?: number;
  backgroundHint?: string;
  styleHint?: string;
  keepBackground?: boolean;
  keepPose?: boolean;
  referenceRoles?: TryOnOptionalReferenceRole[];
  referenceHints?: Partial<Record<TryOnOptionalReferenceRole, string>>;
}

const REFERENCE_INSTRUCTIONS: Record<TryOnOptionalReferenceRole, string> = {
  pose: 'Use this image only for body posture, weight distribution, limb placement and camera angle. Do not copy its identity, clothing, guide lines or background.',
  expression:
    'Transfer only the facial expression. Preserve the identity and facial structure from image 1, never the reference face.',
  scene:
    'Use this image only for the scene, composition and background. Keep the subject identity from image 1.',
  lighting:
    'Use this image only for light direction, softness and color. Keep the subject identity and chosen scene.',
};

export function generateTryOnPrompt(options: TryOnPromptOptions): string {
  const roles = options.referenceRoles ?? [];
  const hasPose = roles.includes('pose');
  const hasScene = roles.includes('scene');
  const hasLighting = roles.includes('lighting');
  const keepBackground = Boolean(options.keepBackground) && !hasScene && !hasLighting;
  const keepPose = options.keepPose ?? true;
  const background = hasScene
    ? 'Replace the original background using the scene reference.'
    : keepBackground
      ? 'Keep the original background, framing and environmental lighting from image 1.'
      : `Create a new scene. ${options.backgroundHint ?? 'Use a clean neutral studio backdrop.'}`;
  const pose = hasPose
    ? 'Follow the pose reference; it takes precedence over the original body posture.'
    : keepPose
      ? 'Keep the original body posture and camera angle from image 1.'
      : 'Choose a natural fashion pose that clearly shows the selected garments.';
  const references = roles.map(
    (role, index) =>
      `Image ${options.clothingCount + index + 2} is the ${role} reference. ${REFERENCE_INSTRUCTIONS[role]}${options.referenceHints?.[role] ? ` Reference description: ${options.referenceHints[role]}` : ''}`,
  );
  return buildPrompt({
    role: 'Create one photorealistic virtual try-on photograph using the supplied reference images.',
    requirements: [
      'Image 1 is the person. Preserve their recognizable face, identity, skin tone, age and body proportions.',
      `Images 2 through ${options.clothingCount + 1} are clothing references. Transfer their cut, color, fabric, pattern and layering to the person. Combine the garments into one outfit; do not copy mannequins or reference backgrounds.`,
      ...references,
      background,
      pose,
      hasLighting ? 'Match the lighting reference instead of the original lighting.' : '',
      options.styleHint
        ? `Styling and finish: ${options.styleHint} Apply only where compatible with the selected pose, scene and lighting above.`
        : '',
      `${QUALITY_REQUIREMENTS.photorealistic}; ${QUALITY_REQUIREMENTS.highQuality}. Keep fabric folds, fit, shadows and anatomy natural.`,
      options.variationIndex !== undefined
        ? `This is variation ${options.variationIndex + 1}. Vary only subtle garment drape and texture details. Do not override the selected scene, pose, expression or lighting.`
        : '',
    ].filter(Boolean),
    guidelines: [
      IDENTITY_PRESERVATION.single,
      'Each reference controls only its declared role. Identity always comes from image 1.',
      'Output one image only, without text, watermarks, guide lines or borders.',
    ],
    output: 'Return ONLY the final image.',
  });
}
