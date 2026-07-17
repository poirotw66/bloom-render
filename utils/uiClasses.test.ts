/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  UI_BTN_GENERATE,
  UI_BTN_SUCCESS,
  UI_FILE_PICKER,
  UI_OPTION_ACTIVE,
  UI_SELECT,
  getPageSurface,
  getTitleAccent,
  uiOption,
} from './uiClasses';

describe('uiClasses', () => {
  it('returns theme-specific page surfaces', () => {
    expect(getPageSurface('bloom')).toContain('fuchsia');
    expect(getPageSurface('newyear')).toContain('red');
    expect(getPageSurface('night')).toContain('slate');
  });

  it('keeps shared success button focus and hover classes', () => {
    expect(UI_BTN_SUCCESS).toContain('bg-green-600');
    expect(UI_BTN_SUCCESS).toContain('hover:bg-green-500');
    expect(UI_BTN_SUCCESS).toContain('focus:ring-green-500');
  });

  it('returns theme-specific title accents', () => {
    expect(getTitleAccent('bloom')).toBe('text-fuchsia-200');
    expect(getTitleAccent('newyear')).toBe('text-red-200');
    expect(getTitleAccent('night')).toBe('text-blue-200');
  });

  it('shares select and option chip focus styles', () => {
    expect(UI_SELECT).toContain('rounded-xl');
    expect(UI_SELECT).toContain('focus:ring-blue-500');
    expect(uiOption(true)).toBe(UI_OPTION_ACTIVE);
    expect(uiOption(false)).toContain('bg-gray-800');
  });

  it('shares upload and generate CTA styles', () => {
    expect(UI_BTN_GENERATE).toContain('bg-blue-600');
    expect(UI_BTN_GENERATE).toContain('px-8');
    expect(UI_FILE_PICKER).toContain('border-gray-600');
  });
});
