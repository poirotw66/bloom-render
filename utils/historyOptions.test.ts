/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { buildHistoryOptions, shouldPersistHistory } from './historyOptions';

describe('buildHistoryOptions', () => {
  it('adds feature, provider, and model without dropping feature options', () => {
    expect(
      buildHistoryOptions(
        'portrait',
        { imageProvider: 'gemini', model: 'gemini-2.5-flash' },
        {
          portraitType: 'half',
          outputSpec: 'clean',
        },
      ),
    ).toEqual({
      portraitType: 'half',
      outputSpec: 'clean',
      feature: 'portrait',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    });
  });

  it('accepts provider alias from ServiceSettings shape', () => {
    expect(
      buildHistoryOptions('generate', { provider: 'openrouter', model: 'google/gemini' }),
    ).toEqual({
      feature: 'generate',
      provider: 'openrouter',
      model: 'google/gemini',
    });
  });

  it('omits provider/model when unset so legacy callers stay sparse', () => {
    expect(buildHistoryOptions('themed', {}, { themeType: 'hanbok' })).toEqual({
      themeType: 'hanbok',
      feature: 'themed',
    });
  });

  it('tags demo runs so history can skip them', () => {
    expect(
      buildHistoryOptions('idphoto', { imageProvider: 'demo', model: 'demo-samples' }),
    ).toEqual({
      feature: 'idphoto',
      provider: 'demo',
      model: 'demo-samples',
      demo: true,
    });
  });
});

describe('shouldPersistHistory', () => {
  it('skips demo provider', () => {
    expect(shouldPersistHistory({ imageProvider: 'demo' })).toBe(false);
    expect(shouldPersistHistory({ provider: 'demo' })).toBe(false);
    expect(shouldPersistHistory({ imageProvider: 'gemini' })).toBe(true);
  });
});
