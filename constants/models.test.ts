/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL,
  MODEL_DESC_KEYS,
  MODEL_LABEL_KEYS,
  SUPPORTED_MODELS,
  resolveStoredModel,
  supportsMultiResolution,
} from './models';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';

describe('supported models', () => {
  it('exposes the three Nano Banana Gemini image models in picker order', () => {
    expect(SUPPORTED_MODELS).toEqual([
      'gemini-nano-banana-2.1',
      'gemini-3.1-flash-lite-image',
      'gemini-3.1-flash-image',
    ]);
    expect(DEFAULT_MODEL).toBe('gemini-3.1-flash-lite-image');
  });

  it('marks 2.1 and Nano Banana 2 as multi-resolution; Lite as 1K-only', () => {
    expect(supportsMultiResolution('gemini-3.1-flash-lite-image')).toBe(false);
    expect(supportsMultiResolution('gemini-3.1-flash-image')).toBe(true);
    expect(supportsMultiResolution('gemini-nano-banana-2.1')).toBe(true);
  });

  it('migrates legacy stored model ids to the default Lite model', () => {
    expect(resolveStoredModel('gemini-2.5-flash-image')).toBe(DEFAULT_MODEL);
    expect(resolveStoredModel('gemini-3-pro-image')).toBe(DEFAULT_MODEL);
    expect(resolveStoredModel('gemini-3-pro-image-preview')).toBe(DEFAULT_MODEL);
    expect(resolveStoredModel('gemini-3.1-flash-image-preview')).toBe('gemini-3.1-flash-image');
    expect(resolveStoredModel('unknown-model')).toBe(DEFAULT_MODEL);
    expect(resolveStoredModel(null)).toBe(DEFAULT_MODEL);
  });

  it('has locale labels and descriptions for every supported model', () => {
    for (const model of SUPPORTED_MODELS) {
      const labelKey = MODEL_LABEL_KEYS[model];
      const descKey = MODEL_DESC_KEYS[model];
      expect(enMessages[labelKey]).toBeTruthy();
      expect(zhTWMessages[labelKey]).toBeTruthy();
      expect(enMessages[descKey]).toBeTruthy();
      expect(zhTWMessages[descKey]).toBeTruthy();
    }
  });
});
