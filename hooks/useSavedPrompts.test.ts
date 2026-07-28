/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  isDuplicatePrompt,
  normalizePromptText,
  withSavedPrompt,
  withoutSavedPrompt,
  type SavedPrompt,
} from './useSavedPrompts';

describe('normalizePromptText', () => {
  it('trims and collapses internal whitespace', () => {
    expect(normalizePromptText('  make it   warmer  \n')).toBe('make it warmer');
  });
});

describe('isDuplicatePrompt', () => {
  const existing: SavedPrompt[] = [{ id: '1', text: 'Warmer lighting', createdAt: 0 }];

  it('matches case-insensitively', () => {
    expect(isDuplicatePrompt(existing, 'warmer lighting')).toBe(true);
    expect(isDuplicatePrompt(existing, 'WARMER LIGHTING')).toBe(true);
  });

  it('does not match distinct text', () => {
    expect(isDuplicatePrompt(existing, 'cooler lighting')).toBe(false);
  });
});

describe('withSavedPrompt', () => {
  it('prepends a new prompt', () => {
    const result = withSavedPrompt([], 'Add rim light');
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Add rim light');
  });

  it('ignores blank input', () => {
    expect(withSavedPrompt([], '   ')).toEqual([]);
  });

  it('skips duplicates instead of adding a second copy', () => {
    const once = withSavedPrompt([], 'Add rim light');
    const twice = withSavedPrompt(once, 'add RIM light  ');
    expect(twice).toHaveLength(1);
  });

  it('enforces the retention cap by dropping the oldest', () => {
    const existing: SavedPrompt[] = [
      { id: 'a', text: 'a', createdAt: 3 },
      { id: 'b', text: 'b', createdAt: 2 },
    ];
    const result = withSavedPrompt(existing, 'c', 2);
    expect(result.map((p) => p.text)).toEqual(['c', 'a']);
  });
});

describe('withoutSavedPrompt', () => {
  it('removes only the matching id', () => {
    const existing: SavedPrompt[] = [
      { id: 'a', text: 'a', createdAt: 1 },
      { id: 'b', text: 'b', createdAt: 2 },
    ];
    expect(withoutSavedPrompt(existing, 'a').map((p) => p.id)).toEqual(['b']);
  });
});
