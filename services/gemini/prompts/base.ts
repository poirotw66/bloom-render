/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Base prompt templates and utilities for all image generation services.
 */

/**
 * Common identity preservation requirements
 */
export const IDENTITY_PRESERVATION = {
  single:
    'preserve identity, same face, same person, same facial structure, no face change, no age change, no gender change',
  couple:
    'preserve identity of both people, same faces, same facial structures, no face change, no age change, no gender change',
  group: (count: number) =>
    `preserve identity of all ${count} people, same faces, same facial structures, no face change, no age change, no gender change`,
};

/**
 * Common quality requirements
 */
export const QUALITY_REQUIREMENTS = {
  photorealistic:
    'realistic, photorealistic, looks like a real photo, not stylized, not artistic, not a painting, not an illustration',
  highQuality: 'high quality, sharp focus, detailed, professional photography',
  studio:
    'professional studio photo retouch, even and soft studio lighting, no shadow on face, no shadow on background',
};

/**
 * Common negative prompts (things to avoid)
 */
export const COMMON_NEGATIVES = {
  identity: 'different person, change face, change identity, face swap, wrong person',
  filters:
    'beautify, over-beautify, beauty filter, meitu, snow app, filter, plastic skin, doll face, over-smooth, airbrushed, fake skin',
  aiArtifacts: 'CGI, AI face, AI generated look, anime, cartoon, illustration, painting, 3d render',
  expressions:
    'smile, laughing, open mouth, teeth, exaggerated expression, tilted head, angle view, side view, looking away',
  lighting:
    'dramatic lighting, rim light, hard light, strong shadow, shadow on face, shadow on background',
  quality:
    'low quality, blurry, noise, jpeg artifacts, oversharpen, deformed, distorted, asymmetrical face, extra face, extra features, bad anatomy, big eyes, small face, unrealistic face, beauty face, idol face',
};

/**
 * Build a complete negative prompt from selected categories
 */
export function buildNegativePrompt(categories: (keyof typeof COMMON_NEGATIVES)[]): string {
  return categories.map((cat) => COMMON_NEGATIVES[cat]).join(', ');
}

/**
 * Build a prompt with structured sections
 */
export interface PromptStructure {
  intro?: string;
  role?: string;
  requirements?: string[];
  guidelines?: string[];
  negative?: string;
  output?: string;
}

export function buildPrompt(structure: PromptStructure): string {
  const parts: string[] = [];

  if (structure.intro) {
    parts.push(structure.intro);
  }

  if (structure.role) {
    parts.push(structure.role);
  }

  if (structure.requirements && structure.requirements.length > 0) {
    parts.push('\nRequirements (MUST follow):');
    parts.push(structure.requirements.join('\n'));
  }

  if (structure.guidelines && structure.guidelines.length > 0) {
    parts.push('\nGuidelines:');
    structure.guidelines.forEach((guideline) => {
      parts.push(`- ${guideline}`);
    });
  }

  if (structure.negative) {
    parts.push('\nNever do (MUST avoid):');
    parts.push(structure.negative);
  }

  if (structure.output) {
    parts.push(`\n${structure.output}`);
  }

  return parts.join('\n');
}
