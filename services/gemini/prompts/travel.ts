/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel photo prompt generation.
 */

import { TRAVEL_POSITIVE_TEMPLATE, TRAVEL_NEGATIVE } from '../../../constants/travel';
import { buildPrompt, IDENTITY_PRESERVATION, QUALITY_REQUIREMENTS } from './base';
import {
  getVariation,
  TRAVEL_LIGHTING_CONDITIONS,
  TRAVEL_CAMERA_ANGLES,
  TRAVEL_POSES_AND_ACTIONS,
  TRAVEL_VISUAL_STYLES,
} from './variations';

export interface TravelPromptOptions {
  scenePrompt: string;
  sceneReferenceImage?: File;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  isGroup?: boolean;
  variationIndex?: number;
}

/**
 * Generate travel photo prompt
 */
export function generateTravelPrompt(options: TravelPromptOptions): string {
  const {
    scenePrompt,
    sceneReferenceImage,
    aspectRatio = '1:1',
    isGroup = false,
    variationIndex,
  } = options;

  // Build scene description
  const sceneForTemplate = sceneReferenceImage
    ? 'at the location shown in the reference image, but with a new creative composition and angle' +
      (scenePrompt.trim() ? `. ${scenePrompt.trim()}` : '')
    : scenePrompt.trim();

  // Build positive prompt using template
  const positive = TRAVEL_POSITIVE_TEMPLATE.replace('{SCENE}', sceneForTemplate);

  // Add variation modifiers if generating multiple images
  let variationModifiers = '';
  if (variationIndex !== undefined) {
    const lighting = getVariation(TRAVEL_LIGHTING_CONDITIONS, variationIndex);
    const angle = getVariation(TRAVEL_CAMERA_ANGLES, variationIndex);
    const pose = getVariation(TRAVEL_POSES_AND_ACTIONS, variationIndex);
    const style = getVariation(TRAVEL_VISUAL_STYLES, variationIndex);

    variationModifiers = `\nVariation Modifiers:\n- ${lighting}\n- ${angle}\n- ${pose}\n- ${style}`;
  }

  // Build aspect ratio hint
  const aspectHint =
    aspectRatio === '16:9'
      ? 'Output in 16:9 landscape aspect ratio.'
      : aspectRatio === '9:16'
        ? 'Output in 9:16 portrait aspect ratio.'
        : 'Output in 1:1 square aspect ratio.';

  // Build intro
  const introRef = sceneReferenceImage
    ? `Note: You are given ${isGroup ? 'multiple' : 2} images. ${isGroup ? 'User portrait(s)' : '1 User portrait'} and 1 Location/Style Reference.\n` +
      'CRITICAL INSTRUCTION: Use the location reference image as a SOURCE OF INSPIRATION for the environment, lighting, and mood. ' +
      'Do NOT copy the reference image composition exactly. ' +
      'Create a FRESH, NEW composition or camera angle based on that location. ' +
      'Make it look like a different photo taken at the same place, possibly from a different viewpoint.\n\n'
    : isGroup
      ? `Note: You are given multiple user portraits. Create a group photo featuring all of them.\n\n`
      : '';

  return buildPrompt({
    intro: introRef,
    role: 'You are an expert travel photo AI. Transform the provided portrait(s) so the person or people appear in the following scene.',
    requirements: [`${positive}${variationModifiers}`],
    negative: TRAVEL_NEGATIVE,
    output: `${aspectHint}\n\nOutput: Return ONLY the final travel photo. Do not return any text.`,
  });
}
