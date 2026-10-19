/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Physical ID-photo size presets at print DPI (default 300).
 */

export const ID_PHOTO_PRINT_DPI = 300;

/** 4×6 inch print sheet (portrait) at 300 DPI. */
export const PRINT_SHEET_WIDTH_IN = 4;
export const PRINT_SHEET_HEIGHT_IN = 6;

export type IdPhotoSizeUnit = 'mm' | 'in';

export type IdPhotoSizeId = 'tw_35x45' | 'us_2x2' | 'jp_30x40' | 'cn_33x48' | 'schengen_35x45';

export interface IdPhotoSizePreset {
  id: IdPhotoSizeId;
  nameKey: string;
  /** Short label for badges (e.g. "35×45 mm"). */
  labelKey: string;
  unit: IdPhotoSizeUnit;
  width: number;
  height: number;
  dpi: number;
}

export const ID_PHOTO_SIZE_PRESETS: readonly IdPhotoSizePreset[] = [
  {
    id: 'tw_35x45',
    nameKey: 'idphoto.size.tw_35x45',
    labelKey: 'idphoto.size.tw_35x45_label',
    unit: 'mm',
    width: 35,
    height: 45,
    dpi: ID_PHOTO_PRINT_DPI,
  },
  {
    id: 'us_2x2',
    nameKey: 'idphoto.size.us_2x2',
    labelKey: 'idphoto.size.us_2x2_label',
    unit: 'in',
    width: 2,
    height: 2,
    dpi: ID_PHOTO_PRINT_DPI,
  },
  {
    id: 'jp_30x40',
    nameKey: 'idphoto.size.jp_30x40',
    labelKey: 'idphoto.size.jp_30x40_label',
    unit: 'mm',
    width: 30,
    height: 40,
    dpi: ID_PHOTO_PRINT_DPI,
  },
  {
    id: 'cn_33x48',
    nameKey: 'idphoto.size.cn_33x48',
    labelKey: 'idphoto.size.cn_33x48_label',
    unit: 'mm',
    width: 33,
    height: 48,
    dpi: ID_PHOTO_PRINT_DPI,
  },
  {
    id: 'schengen_35x45',
    nameKey: 'idphoto.size.schengen_35x45',
    labelKey: 'idphoto.size.schengen_35x45_label',
    unit: 'mm',
    width: 35,
    height: 45,
    dpi: ID_PHOTO_PRINT_DPI,
  },
] as const;

export const DEFAULT_ID_PHOTO_SIZE_ID: IdPhotoSizeId = 'tw_35x45';

export function getIdPhotoSizePreset(id: IdPhotoSizeId): IdPhotoSizePreset {
  return ID_PHOTO_SIZE_PRESETS.find((p) => p.id === id) ?? ID_PHOTO_SIZE_PRESETS[0]!;
}

export function mmToPx(mm: number, dpi: number = ID_PHOTO_PRINT_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}

export function inToPx(inches: number, dpi: number = ID_PHOTO_PRINT_DPI): number {
  return Math.round(inches * dpi);
}

export function presetPixelSize(preset: IdPhotoSizePreset): { width: number; height: number } {
  if (preset.unit === 'in') {
    return { width: inToPx(preset.width, preset.dpi), height: inToPx(preset.height, preset.dpi) };
  }
  return { width: mmToPx(preset.width, preset.dpi), height: mmToPx(preset.height, preset.dpi) };
}

export function printSheetPixelSize(dpi: number = ID_PHOTO_PRINT_DPI): {
  width: number;
  height: number;
} {
  return {
    width: inToPx(PRINT_SHEET_WIDTH_IN, dpi),
    height: inToPx(PRINT_SHEET_HEIGHT_IN, dpi),
  };
}

export function isIdPhotoSizeId(value: string): value is IdPhotoSizeId {
  return ID_PHOTO_SIZE_PRESETS.some((p) => p.id === value);
}
