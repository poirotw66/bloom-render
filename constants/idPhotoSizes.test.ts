/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  getIdPhotoSizePreset,
  inToPx,
  mmToPx,
  presetPixelSize,
  printSheetPixelSize,
} from './idPhotoSizes';

describe('id photo physical sizes', () => {
  it('converts mm and inches to 300 DPI pixels', () => {
    expect(mmToPx(25.4, 300)).toBe(300);
    expect(inToPx(2, 300)).toBe(600);
    expect(mmToPx(35, 300)).toBe(413);
    expect(mmToPx(45, 300)).toBe(531);
  });

  it('resolves each preset to exact pixel dimensions', () => {
    expect(presetPixelSize(getIdPhotoSizePreset('us_2x2'))).toEqual({ width: 600, height: 600 });
    expect(presetPixelSize(getIdPhotoSizePreset('tw_35x45'))).toEqual({
      width: 413,
      height: 531,
    });
    expect(presetPixelSize(getIdPhotoSizePreset('jp_30x40'))).toEqual({
      width: 354,
      height: 472,
    });
    expect(presetPixelSize(getIdPhotoSizePreset('cn_33x48'))).toEqual({
      width: 390,
      height: 567,
    });
    expect(presetPixelSize(getIdPhotoSizePreset('schengen_35x45'))).toEqual({
      width: 413,
      height: 531,
    });
  });

  it('sizes the 4×6 sheet at 300 DPI', () => {
    expect(printSheetPixelSize(300)).toEqual({ width: 1200, height: 1800 });
  });
});
