/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmDiscardUnsavedWork, hasUnsavedWork } from './useUnsavedWork';

// useUnsavedWork itself needs React's effect lifecycle; these cover the pure
// decision logic the nav links call into.

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('confirmDiscardUnsavedWork', () => {
  it('allows navigation without prompting when no route registered work', () => {
    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('window', { confirm: confirmSpy });

    expect(hasUnsavedWork()).toBe(false);
    expect(confirmDiscardUnsavedWork('discard?')).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
