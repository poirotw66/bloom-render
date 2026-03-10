/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PortraitType, OutputSpec } from '../types';

export const PORTRAIT_TYPES: {
  id: PortraitType;
  nameKey: string;
  promptHint: string;
}[] = [
  {
    id: 'premium_leader',
    nameKey: 'portrait.type.premium_leader',
    promptHint:
      "Leader's vision style. Distinguished, authoritative, high-end executive look with premium studio lighting.",
  },
  {
    id: 'premium_erya',
    nameKey: 'portrait.type.premium_erya',
    promptHint:
      'Erya Atelier museum-grade portrait. Ultimate refined aesthetic, gallery-quality lighting and composition, timeless artistic presence.',
  },
  {
    id: 'corporate_mag',
    nameKey: 'portrait.type.corporate_mag',
    promptHint:
      'Magazine style corporate portrait. High-fashion, editorial look, sharp and sophisticated.',
  },
  {
    id: 'graduation',
    nameKey: 'portrait.type.graduation',
    promptHint: 'Graduation portrait for students. Academic, commemorative, youthful but formal.',
  },
  {
    id: 'business',
    nameKey: 'portrait.type.business',
    promptHint:
      'Standard professional business portrait. Reliable, approachable, suitable for corporate use and LinkedIn.',
  },
  {
    id: 'cabin_crew',
    nameKey: 'portrait.type.cabin_crew',
    promptHint: 'Cabin crew style. Extremely neat, friendly, professional, and presentable.',
  },
  {
    id: 'model_card',
    nameKey: 'portrait.type.model_card',
    promptHint:
      'Model card style. Highlights physical features, distinctive style, suitable for model portfolios.',
  },
  {
    id: 'portrait_resume_grad',
    nameKey: 'portrait.type.portrait_resume_grad',
    promptHint:
      'Graduate resume portrait. Suitable for thesis and major job platforms. Academic, professional, approachable.',
  },
  {
    id: 'portrait_resume',
    nameKey: 'portrait.type.portrait_resume',
    promptHint:
      'Resume portrait for job applications and social profiles. Professional, approachable, suitable for LinkedIn and resumes.',
  },
];

export const PORTRAIT_OUTPUT_SPECS: {
  id: OutputSpec;
  nameKey: string;
  cropHint: string;
}[] = [
  {
    id: 'full_body',
    nameKey: 'portrait.spec.full_body',
    cropHint:
      'professional full-body portrait, standing or sitting, capturing the whole figure and outfit.',
  },
  {
    id: 'half_body',
    nameKey: 'portrait.spec.half_body',
    cropHint:
      'professional half-body portrait, from waist up, focused on professional posture and expression.',
  },
];

export const DEFAULT_PORTRAIT_TYPE: PortraitType = 'business';
export const DEFAULT_PORTRAIT_SPEC: OutputSpec = 'half_body';
