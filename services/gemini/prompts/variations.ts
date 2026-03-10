/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Variation modifiers for generating diverse outputs when creating multiple images.
 */

/**
 * Get a variation modifier from an array based on variation index
 */
export function getVariation<T>(variations: T[], variationIndex: number): T {
  return variations[variationIndex % variations.length];
}

/**
 * Lighting variations for professional portraits
 */
export const LIGHTING_VARIATIONS = [
  'soft natural studio lighting',
  'dramatic side lighting',
  'even diffused lighting',
  'warm golden hour lighting',
  'cool professional lighting',
];

/**
 * Camera angle variations
 */
export const ANGLE_VARIATIONS = [
  'eye level shot',
  'slightly elevated angle',
  'slightly lower angle',
  'portrait angle',
  'fashion photography angle',
];

/**
 * Expression variations for professional portraits
 */
export const EXPRESSION_VARIATIONS = [
  'natural confident expression',
  'slight professional smile',
  'serious professional expression',
  'approachable expression',
  'authoritative expression',
];

/**
 * Composition variations for themed photos
 */
export const COMPOSITION_VARIATIONS = [
  'unique composition and framing',
  'distinctive camera angle and perspective',
  'varied lighting and mood',
  'different pose arrangement',
  'alternative visual composition',
];

/**
 * Detail variations for themed photos
 */
export const DETAIL_VARIATIONS = [
  'with subtle unique details',
  'with distinct visual elements',
  'with varied atmospheric effects',
  'with different depth of field',
  'with unique color grading',
];

/**
 * ID photo specific variations (subtle changes)
 */
export const ID_PHOTO_VARIATIONS = [
  'slight variation in lighting angle',
  'subtle difference in facial expression',
  'minor variation in head position',
  'slight difference in camera distance',
  'subtle variation in background lighting',
];

/**
 * Couple/Group specific variations
 */
export const COUPLE_GROUP_LIGHTING_VARIATIONS = [
  'soft natural lighting',
  'dramatic side lighting',
  'warm golden hour lighting',
  'even studio lighting',
  'cinematic lighting',
];

export const COUPLE_GROUP_COMPOSITION_VARIATIONS = [
  'unique composition and arrangement',
  'distinctive framing and positioning',
  'varied spatial arrangement',
  'different pose configuration',
  'alternative layout',
];

export const COUPLE_GROUP_EXPRESSION_VARIATIONS = [
  'natural expressions',
  'genuine interactions',
  'authentic moments',
  'spontaneous poses',
  'candid expressions',
];

/**
 * Travel photo variations (from travelPromptGenerator)
 */
export const TRAVEL_LIGHTING_CONDITIONS = [
  'soft natural lighting, morning atmosphere',
  'golden hour sunlight, warm tones, cinematic lighting',
  'bright sunny day, harsh shadows, high contrast',
  'soft overcast lighting, diffused light, even tones',
  'dramatic sunset lighting, rim light, atmospheric',
  'moody cinematic lighting, slightly dim, emotional atmosphere',
];

export const TRAVEL_CAMERA_ANGLES = [
  'eye level shot, medium shot',
  'low angle shot, looking up, empowering angle',
  'wide angle shot, capturing the vast scenery',
  'slightly from above, flattering angle',
  'portrait photography, focusing on the person with background bokeh',
];

export const TRAVEL_POSES_AND_ACTIONS = [
  'looking naturally at the camera, slight smile',
  'looking away at the scenery, candid moment, side profile',
  'walking naturally through the scene, motion blur',
  'standing confidently, fashion pose',
  'adjusting hair, candid snapshot',
  'holding a coffee or drink, casual vibe',
  'smiling brightly, enjoying the travel',
  'looking back over shoulder, alluring pose',
];

export const TRAVEL_VISUAL_STYLES = [
  'photorealistic, 8k, highly detailed, sharp focus',
  'shot on 35mm film, kodak portra 400, grainy texture, vintage feel',
  'modern travel photography, instagram style, vibrant colors',
  'editorial fashion photography, clean look, professional color grading',
  'documentary style, raw and authentic, storytelling',
];

/**
 * Try-on / outfit style variations (fashion catalog style)
 */
export const TRYON_POSE_VARIATIONS = [
  'model standing upright, full body visible, facing camera with slight turn, confident stance',
  'model standing at a slight angle, one hand on hip, full outfit clearly visible, fashion pose',
  'model in a relaxed standing pose, arms naturally at sides, showcasing the full outfit',
  'model in a three-quarter view, natural walking or standing pose, outfit displayed clearly',
];

export const TRYON_BACKGROUND_VARIATIONS = [
  'clean, neutral studio background, soft even lighting, minimal backdrop',
  'plain light-colored wall or seamless backdrop, professional fashion photography',
  'soft gradient or neutral tone background, no clutter, focus on the outfit',
  'minimal studio setting, soft shadows, professional catalog style',
];

/**
 * Build variation note for multiple image generation
 */
export interface VariationNote {
  lighting?: string;
  angle?: string;
  expression?: string;
  composition?: string;
  detail?: string;
}

export function buildVariationNote(variations: VariationNote): string {
  const parts: string[] = [];

  if (variations.lighting) parts.push(`- Apply ${variations.lighting}.`);
  if (variations.angle) parts.push(`- Use ${variations.angle}.`);
  if (variations.expression) parts.push(`- Capture ${variations.expression}.`);
  if (variations.composition) parts.push(`- Apply ${variations.composition}.`);
  if (variations.detail) parts.push(`- Include ${variations.detail}.`);

  if (parts.length === 0) return '';

  return `\nVariation Requirements:\n${parts.join('\n')}\n- Create a unique interpretation while maintaining all requirements.`;
}
