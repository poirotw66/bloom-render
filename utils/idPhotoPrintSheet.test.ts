/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { getIdPhotoSizePreset } from '../constants/idPhotoSizes';
import { computePrintSheetLayout, layoutForPreset } from './idPhotoPrintSheet';

describe('id photo print sheet layout', () => {
  it('fits multiple US 2×2 photos on a 4×6 sheet', () => {
    const layout = layoutForPreset(getIdPhotoSizePreset('us_2x2'));
    expect(layout.photoW).toBe(600);
    expect(layout.photoH).toBe(600);
    expect(layout.sheetW).toBe(1200);
    expect(layout.sheetH).toBe(1800);
    expect(layout.count).toBeGreaterThanOrEqual(2);
    expect(layout.cols * layout.rows).toBe(layout.count);
  });

  it('fits more Japan 30×40 photos than US 2×2', () => {
    const us = layoutForPreset(getIdPhotoSizePreset('us_2x2'));
    const jp = layoutForPreset(getIdPhotoSizePreset('jp_30x40'));
    expect(jp.count).toBeGreaterThan(us.count);
  });

  it('centers the grid on the sheet', () => {
    const layout = computePrintSheetLayout(600, 600, 1200, 1800, 45, 24);
    expect(layout.offsetX).toBeGreaterThanOrEqual(0);
    expect(layout.offsetY).toBeGreaterThanOrEqual(0);
    expect(layout.offsetX + layout.cols * 600 + (layout.cols - 1) * 24).toBeLessThanOrEqual(1200);
  });
});
