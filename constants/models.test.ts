/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL,
  MODEL_LABEL_KEYS,
  SUPPORTED_MODELS,
  resolveStoredModel,
  supportsMultiResolution,
} from './models';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';

describe('supported models', () => {
  it('exposes the three current Gemini image models', () => {
    expect(SUPPORTED_MODELS).toEqual([
      'gemini-3.1-flash-lite-image',
      'gemini-3.1-flash-image',
      'gemini-3-pro-image',
    ]);
    expect(DEFAULT_MODEL).toBe('gemini-3.1-flash-lite-image');
  });

  it('marks flash and pro as multi-resolution, lite as 1K-only', () => {
    expect(supportsMultiResolution('gemini-3.1-flash-lite-image')).toBe(false);
    expect(supportsMultiResolution('gemini-3.1-flash-image')).toBe(true);
    expect(supportsMultiResolution('gemini-3-pro-image')).toBe(true);
  });

  it('migrates legacy stored model ids', () => {
    expect(resolveStoredModel('gemini-2.5-flash-image')).toBe('gemini-3.1-flash-lite-image');
    expect(resolveStoredModel('gemini-3.1-flash-image-preview')).toBe('gemini-3.1-flash-image');
    expect(resolveStoredModel('gemini-3-pro-image-preview')).toBe('gemini-3-pro-image');
    expect(resolveStoredModel('unknown-model')).toBe(DEFAULT_MODEL);
    expect(resolveStoredModel(null)).toBe(DEFAULT_MODEL);
  });

  it('has locale labels for every supported model', () => {
    for (const model of SUPPORTED_MODELS) {
      const key = MODEL_LABEL_KEYS[model];
      expect(enMessages[key]).toBeTruthy();
      expect(zhTWMessages[key]).toBeTruthy();
    }
  });
});
