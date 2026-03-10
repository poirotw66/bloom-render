/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ThemedType } from '../types';

export const THEMED_TYPES: {
  id: ThemedType;
  nameKey: string;
  promptHint: string;
}[] = [
  {
    id: 'themed-birthday',
    nameKey: 'service.item.themed_birthday.name',
    promptHint:
      'Birthday celebration portrait. Festive, joyful, with themed lighting and celebratory atmosphere. Keep the same person.',
  },
  {
    id: 'themed-magazine',
    nameKey: 'service.item.themed_magazine.name',
    promptHint:
      'High-fashion magazine cover style. Editorial lighting, chic styling, magazine-quality retouching. Same person.',
  },
  {
    id: 'themed-grad-polaroid',
    nameKey: 'service.item.themed_grad_polaroid.name',
    promptHint:
      'Graduation portrait in polaroid / instant film style. Academic, commemorative, vintage polaroid look. Same person.',
  },
  {
    id: 'themed-polaroid',
    nameKey: 'service.item.themed_polaroid.name',
    promptHint:
      'Polaroid or instant film style portrait. Retro, candid, soft tones, polaroid aesthetic. Same person.',
  },
  {
    id: 'themed-polaroid-set',
    nameKey: 'service.item.themed_polaroid_set.name',
    promptHint:
      'Polaroid set style portrait. Multiple-frame feel, retro instant film, stylish. Same person.',
  },
  {
    id: 'themed-sport',
    nameKey: 'service.item.themed_sport.name',
    promptHint: 'Sports photography style. Athletic, dynamic, fitness or sport theme. Same person.',
  },
  {
    id: 'themed-maternity',
    nameKey: 'service.item.themed_maternity.name',
    promptHint: 'Maternity portrait. Gentle, warm, celebrating pregnancy. Same person.',
  },
  {
    id: 'themed-kendall',
    nameKey: 'service.item.themed_kendall.name',
    promptHint:
      'Kendall-style high contrast black and white fashion portrait. Editorial, bold. Same person.',
  },
  {
    id: 'themed-us-college',
    nameKey: 'service.item.themed_us_college.name',
    promptHint: 'American college style portrait. Preppy, classic campus vibe. Same person.',
  },
  {
    id: 'themed-us-sport',
    nameKey: 'service.item.themed_us_sport.name',
    promptHint: 'American sports style portrait. Energetic, athletic, collegiate. Same person.',
  },
  {
    id: 'themed-retro-high',
    nameKey: 'service.item.themed_retro_high.name',
    promptHint: 'Retro American high school style. Vintage, yearbook aesthetic. Same person.',
  },
  {
    id: 'themed-music',
    nameKey: 'service.item.themed_music.name',
    promptHint:
      'Musician or artist portrait. Artistic, creative, music-industry vibe. Same person.',
  },
  {
    id: 'themed-kids',
    nameKey: 'service.item.themed_kids.name',
    promptHint:
      'Kids photography style. Entrance or graduation theme, youthful, bright. Same person.',
  },
  {
    id: 'themed-pet-owner',
    nameKey: 'service.item.themed_pet_owner.name',
    promptHint: 'Pet and owner portrait. Person with pet, warm interaction, same person and pet.',
  },
  {
    id: 'themed-pet',
    nameKey: 'service.item.themed_pet.name',
    promptHint:
      'Pet photography. Cute, professional pet portrait. If image shows a person with pet, keep both; otherwise focus on pet.',
  },
];

export const DEFAULT_THEMED_TYPE: ThemedType = 'themed-polaroid';
