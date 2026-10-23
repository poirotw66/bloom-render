/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  buildMultiPersonPromptFromTemplate,
  buildMultiPersonViralPrompt,
  clampMultiPersonCount,
  isValidMultiPersonCount,
  MULTI_PERSON_MAX,
  MULTI_PERSON_MIN,
} from './multiPersonPrompt';

describe('multiPersonPrompt', () => {
  it('validates 2–4 person counts', () => {
    expect(isValidMultiPersonCount(2)).toBe(true);
    expect(isValidMultiPersonCount(4)).toBe(true);
    expect(isValidMultiPersonCount(1)).toBe(false);
    expect(isValidMultiPersonCount(5)).toBe(false);
    expect(clampMultiPersonCount(1)).toBe(MULTI_PERSON_MIN);
    expect(clampMultiPersonCount(9)).toBe(MULTI_PERSON_MAX);
  });

  it('requires preserving identity and forbids face mixing', () => {
    const prompt = buildMultiPersonViralPrompt({
      stylePrompt: 'Warm autumn park couple portrait with soft backlight.',
      personCount: 2,
    });
    expect(prompt.toLowerCase()).toMatch(/facial|identity|features/);
    expect(prompt).toMatch(/do NOT blend|mix faces/i);
    expect(prompt).toMatch(/exactly 2/i);
    expect(prompt).toContain('Warm autumn park couple portrait');
  });

  it('mentions all people for groups of three or four', () => {
    const prompt = buildMultiPersonViralPrompt({
      stylePrompt: 'Festive indoor family portrait.',
      personCount: 4,
    });
    expect(prompt).toMatch(/exactly 4/i);
    expect(prompt).toMatch(/person 1 through person 4/i);
  });

  it('builds from a viral template prompt', () => {
    const prompt = buildMultiPersonPromptFromTemplate(
      {
        id: 'family-portrait',
        prompt: 'Create a warm multi-generational family portrait indoors.',
      },
      3,
    );
    expect(prompt).toContain('family portrait');
    expect(prompt).toContain('family-portrait');
  });
});
