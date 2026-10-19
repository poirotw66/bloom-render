/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { buildHistoryOptions } from './historyOptions';

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
});
