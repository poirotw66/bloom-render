/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { canStartStyleCollage, STYLE_COLLAGE_MAX, toggleViralSelection } from './viralSelection';

describe('viralSelection', () => {
  it('adds and removes ids', () => {
    const a = toggleViralSelection([], 'figurine-box');
    expect(a.ids).toEqual(['figurine-box']);
    const b = toggleViralSelection(a.ids, 'polaroid-frame');
    expect(b.ids).toEqual(['figurine-box', 'polaroid-frame']);
    const c = toggleViralSelection(b.ids, 'figurine-box');
    expect(c.ids).toEqual(['polaroid-frame']);
  });

  it('rejects adds beyond max without changing order', () => {
    const full = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(full).toHaveLength(STYLE_COLLAGE_MAX);
    const next = toggleViralSelection(full, 'g');
    expect(next.rejectedAtMax).toBe(true);
    expect(next.ids).toEqual(full);
  });

  it('allows starting collage only with 4–6 selections', () => {
    expect(canStartStyleCollage(3)).toBe(false);
    expect(canStartStyleCollage(4)).toBe(true);
    expect(canStartStyleCollage(6)).toBe(true);
    expect(canStartStyleCollage(7)).toBe(false);
  });
});
