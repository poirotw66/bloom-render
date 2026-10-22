/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  UI_BTN_GENERATE,
  UI_BTN_PRIMARY,
  UI_BTN_SUCCESS,
  UI_CHIP_ACTIVE,
  UI_FILE_PICKER,
  UI_INPUT,
  UI_OPTION_ACTIVE,
  UI_OPTION_INACTIVE,
  UI_SELECT,
  getPageSurface,
  getTitleAccent,
  uiOption,
} from './uiClasses';

describe('uiClasses', () => {
  it('returns theme-specific page surfaces', () => {
    expect(getPageSurface('bloom')).toContain('theme-surface');
    expect(getPageSurface('newyear')).toContain('theme-border');
    expect(getPageSurface('night')).toContain('theme-surface');
  });

  it('keeps shared success button focus and hover classes', () => {
    expect(UI_BTN_SUCCESS).toContain('bg-green-600');
    expect(UI_BTN_SUCCESS).toContain('hover:bg-green-500');
    expect(UI_BTN_SUCCESS).toContain('focus-visible:ring-green-500');
  });

  it('returns theme-specific title accents', () => {
    expect(getTitleAccent('bloom')).toBe('brand-text-soft');
    expect(getTitleAccent('newyear')).toBe('text-yellow-300');
    expect(getTitleAccent('night')).toBe('text-cyan-300');
  });

  it('shares select and option chip focus styles', () => {
    expect(UI_SELECT).toContain('rounded-xl');
    expect(UI_SELECT).toContain('focus-visible:brand-ring');
    expect(uiOption(true)).toBe(UI_OPTION_ACTIVE);
    expect(uiOption(false)).toContain('theme-raised');
  });

  it('shows focus rings only for keyboard focus', () => {
    for (const token of [
      UI_BTN_PRIMARY,
      UI_BTN_SUCCESS,
      UI_CHIP_ACTIVE,
      UI_INPUT,
      UI_OPTION_ACTIVE,
      UI_OPTION_INACTIVE,
    ]) {
      expect(token).toContain('focus-visible:ring');
      expect(token).not.toMatch(/(^|\s)focus:ring/);
    }
  });

  it('shares upload and generate CTA styles', () => {
    expect(UI_BTN_GENERATE).toContain('brand-bg');
    expect(UI_BTN_GENERATE).toContain('px-8');
    expect(UI_FILE_PICKER).toContain('theme-border');
  });
});
