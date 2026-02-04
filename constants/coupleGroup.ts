/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Couple and group photo styles - specific styles for duo/group photography.
 */

export type CoupleStyle =
  | 'couple_romance'
  | 'couple_bestie'
  | 'couple_retro_high'
  | 'couple_us_college'
  | 'couple_office'
  | 'couple_home'
  | 'couple_dragon'
  | 'couple_robe'
  | 'couple_polaroid';

export type GroupStyle =
  | 'group_family'
  | 'group_family_spring'
  | 'group_new_style'
  | 'group_grad';

export const COUPLE_STYLES: {
  id: CoupleStyle;
  nameKey: string;
  promptHint: string;
}[] = [
  {
    id: 'couple_romance',
    nameKey: 'service.item.couple_romance.name',
    promptHint:
      'Romantic couple portrait. Sweet, intimate, capturing genuine interactions between two people. Professional studio lighting, warm and tender atmosphere. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_bestie',
    nameKey: 'service.item.couple_bestie.name',
    promptHint:
      'Best friends portrait. Fun, memorable, joyful interaction between two close friends. Natural and candid moments. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_retro_high',
    nameKey: 'service.item.couple_retro_high.name',
    promptHint:
      'Vintage American high school style couple portrait. Retro 90s aesthetic, classic high school yearbook style. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_us_college',
    nameKey: 'service.item.couple_us_college.name',
    promptHint:
      'American college style couple portrait. Preppy, classic campus vibe, collegiate aesthetic. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_office',
    nameKey: 'service.item.couple_office.name',
    promptHint:
      'Professional couple portrait. Workplace power couple look, business formal attire, professional studio setting. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_home',
    nameKey: 'service.item.couple_home.name',
    promptHint:
      'Cozy home couple portrait. Relaxed and intimate home setting, casual and warm atmosphere, lifestyle photography. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_dragon',
    nameKey: 'service.item.couple_dragon.name',
    promptHint:
      'Traditional Chinese wedding couple portrait. Dragon and phoenix traditional wedding attire, elegant and ceremonial, cultural heritage style. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_robe',
    nameKey: 'service.item.couple_robe.name',
    promptHint:
      'Relaxed robe style best friends portrait. Lazy, cozy, intimate atmosphere, casual and fun. Both people maintain their identity from source images.',
  },
  {
    id: 'couple_polaroid',
    nameKey: 'service.item.promo_duo_polaroid.name',
    promptHint:
      'Polaroid style couple portrait. Retro instant film aesthetic, candid and stylish, polaroid/instant film look. Both people maintain their identity from source images.',
  },
];

export const GROUP_STYLES: {
  id: GroupStyle;
  nameKey: string;
  promptHint: string;
}[] = [
  {
    id: 'group_family',
    nameKey: 'service.item.group_family.name',
    promptHint:
      'Timeless family portrait. Professional studio setting, capturing the bond between generations. All people maintain their identity from source images. Natural and harmonious group composition.',
  },
  {
    id: 'group_family_spring',
    nameKey: 'service.item.promo_family_spring.name',
    promptHint:
      'Spring family portrait. Festive themed session with seasonal outfits. Warm and joyful atmosphere. All people maintain their identity from source images.',
  },
  {
    id: 'group_new_style',
    nameKey: 'service.item.group_new_style.name',
    promptHint:
      'New Chinese style group portrait. Trending New Chinese aesthetic, traditional elements with modern twist, elegant and sophisticated. All people maintain their identity from source images.',
  },
  {
    id: 'group_grad',
    nameKey: 'service.item.group_grad.name',
    promptHint:
      'Group graduation portrait. Celebrate graduation with friends and family. Academic atmosphere, graduation attire. All people maintain their identity from source images.',
  },
];

export const DEFAULT_COUPLE_STYLE: CoupleStyle = 'couple_romance';
export const DEFAULT_GROUP_STYLE: GroupStyle = 'group_family';
