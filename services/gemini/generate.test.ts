/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildGeneratePrompt } from './generate';

describe('buildGeneratePrompt', () => {
  it('returns the user prompt unchanged when there is no reference image', () => {
    expect(buildGeneratePrompt('a red balloon', false)).toBe('a red balloon');
  });

  it('appends reference guidance when a reference image is present', () => {
    const result = buildGeneratePrompt('a red balloon', true);
    expect(result.startsWith('a red balloon\n\n')).toBe(true);
    expect(result).toContain('A reference image is attached');
    expect(result).toContain('Do NOT copy the reference exactly');
  });
});
