/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 春山企業 韓式證件照 - 證件類型、修圖等級、輸出規格
 */

export type RetouchLevel = 'premium' | 'standard' | 'self';
export type IdPhotoType = 'domestic' | 'passport' | 'taiwan_compatriot' | 'student' | 'work' | 'military_police_medical' | 'cabin_crew' | 'graduation';
export type OutputSpec = 'head_shoulders' | 'half_body';

/** 修圖等級：極致完顏® / 完顏® / SELF（妝髮自理） */
export const RETOUCH_LEVELS: {
  id: RetouchLevel;
  nameKey: string;
  /** 替換或補充 base 中的 retouch 描述（插入到 positive） */
  positiveModifier: string;
  /** 追加到 base negative 的額外禁止項（SELF 加碼） */
  negativeExtra: string;
  price?: number;
}[] = [
  {
    id: 'premium',
    nameKey: 'idphoto.level.premium',
    positiveModifier: 'refined professional retouch, even skin texture, subtle enhancement of complexion and professional look, avoid over-beautify or plastic skin or doll face.',
    negativeExtra: '',
    price: 1800,
  },
  {
    id: 'standard',
    nameKey: 'idphoto.level.standard',
    positiveModifier: 'natural skin texture, minimal retouch, subtle professional retouch.',
    negativeExtra: '',
    price: 1200,
  },
  {
    id: 'self',
    nameKey: 'idphoto.level.self',
    positiveModifier: 'no makeup look, no hairstyling look, natural retouch only, do not over-retouch, preserve original skin texture and complexion, only fix blemishes and minor unevenness.',
    negativeExtra: 'beautify, heavy retouch, smooth skin, change skin tone, makeup, makeup look, over-smooth, airbrushed.',
    price: 590,
  },
];

/** 證件類型（精簡 8 種） */
export const ID_PHOTO_TYPES: {
  id: IdPhotoType;
  nameKey: string;
  promptHint: string;
}[] = [
  { id: 'domestic', nameKey: 'idphoto.type.domestic', promptHint: 'Suitable for Taiwan ID, health insurance card, driver license. Comply with domestic ID photo standards.' },
  { id: 'passport', nameKey: 'idphoto.type.passport', promptHint: 'Suitable for passport and visa. Comply with international passport/visa requirements, clear and identifiable.' },
  { id: 'taiwan_compatriot', nameKey: 'idphoto.type.taiwan_compatriot', promptHint: 'Suitable for Taiwan Travel Permit (台胞證). Comply with cross-strait travel document requirements.' },
  { id: 'student', nameKey: 'idphoto.type.student', promptHint: 'Suitable for student ID, resume. Neat, formal, youthful.' },
  { id: 'work', nameKey: 'idphoto.type.work', promptHint: 'Suitable for employee ID, workplace badge, resume. Professional and reliable.' },
  { id: 'military_police_medical', nameKey: 'idphoto.type.military_police_medical', promptHint: 'Suitable for military, police, or medical professional ID. Authoritative, professional, confident.' },
  { id: 'cabin_crew', nameKey: 'idphoto.type.cabin_crew', promptHint: 'Suitable for cabin crew / flight attendant application. Neat, professional, presentable.' },
  { id: 'graduation', nameKey: 'idphoto.type.graduation', promptHint: 'Suitable for graduation photo (bachelor, master, PhD). Formal, commemorative.' },
];

/** 輸出規格：構圖 / 裁切提示 */
export const OUTPUT_SPECS: {
  id: OutputSpec;
  nameKey: string;
  cropHint: string;
}[] = [
  { id: 'head_shoulders', nameKey: 'idphoto.spec.head_shoulders', cropHint: 'head and shoulders, centered and symmetrical composition, correct ID photo framing, proper head size, face centered.' },
  { id: 'half_body', nameKey: 'idphoto.spec.half_body', cropHint: 'upper body, half-body portrait, from chest or waist up, centered and symmetrical, proper framing.' },
];

export const DEFAULT_ID_TYPE: IdPhotoType = 'domestic';
export const DEFAULT_RETOUCH_LEVEL: RetouchLevel = 'standard';
export const DEFAULT_OUTPUT_SPEC: OutputSpec = 'head_shoulders';
