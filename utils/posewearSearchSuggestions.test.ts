import { describe, expect, it } from 'vitest';
import { materialSearchSuggestions, parseMaterialSearchHistory } from './posewearSearchSuggestions';
describe('material search suggestions', () => {
  it('validates bounded deduplicated strings at the storage boundary', () => {
    expect(parseMaterialSearchHistory({ q: 'bad' })).toEqual([]);
    expect(parseMaterialSearchHistory([null, 42, '', '  seated  ', 'SEATED', 'a\n b'])).toEqual([
      'seated',
      'a b',
    ]);
    expect(
      parseMaterialSearchHistory(Array.from({ length: 20 }, (_, i) => `item ${i}`)),
    ).toHaveLength(8);
    expect(parseMaterialSearchHistory(['x'.repeat(500)])[0]).toHaveLength(120);
  });
  it('suggests only own catalog titles matching the current role and query', () => {
    const suggestions = materialSearchSuggestions('navy', 'clothing', 'en');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((value) => value.toLowerCase().includes('navy'))).toBe(true);
    expect(materialSearchSuggestions('navy', 'pose', 'en')).toEqual([]);
  });
});
