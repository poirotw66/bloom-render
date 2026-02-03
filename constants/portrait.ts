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
            promptHint: 'Leader\'s vision style. Distinguished, authoritative, high-end executive look with premium studio lighting.'
        },
        {
            id: 'corporate_mag',
            nameKey: 'portrait.type.corporate_mag',
            promptHint: 'Magazine style corporate portrait. High-fashion, editorial look, sharp and sophisticated.'
        },
        {
            id: 'graduation',
            nameKey: 'portrait.type.graduation',
            promptHint: 'Graduation portrait for students. Academic, commemorative, youthful but formal.'
        },
        {
            id: 'business',
            nameKey: 'portrait.type.business',
            promptHint: 'Standard professional business portrait. Reliable, approachable, suitable for corporate use and LinkedIn.'
        },
        {
            id: 'cabin_crew',
            nameKey: 'portrait.type.cabin_crew',
            promptHint: 'Cabin crew style. Extremely neat, friendly, professional, and presentable.'
        },
        {
            id: 'model_card',
            nameKey: 'portrait.type.model_card',
            promptHint: 'Model card style. Highlights physical features, distinctive style, suitable for model portfolios.'
        },
    ];

export const PORTRAIT_OUTPUT_SPECS: {
    id: OutputSpec;
    nameKey: string;
    cropHint: string;
}[] = [
        {
            id: 'half_body',
            nameKey: 'portrait.spec.half_body',
            cropHint: 'professional half-body portrait, from waist up, focused on professional posture and expression.'
        },
        {
            id: 'head_shoulders',
            nameKey: 'portrait.spec.head_shoulders',
            cropHint: 'professional head and shoulders shot, clean and focused on facial expression.'
        },
    ];

export const DEFAULT_PORTRAIT_TYPE: PortraitType = 'business';
export const DEFAULT_PORTRAIT_SPEC: OutputSpec = 'half_body';
