/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDisplayResult } from './useDisplayResult';

describe('useDisplayResult', () => {
  it('starts with the source and accepts enhance overrides', () => {
    const { result, rerender } = renderHook(({ src }) => useDisplayResult(src), {
      initialProps: { src: 'data:a' },
    });
    expect(result.current.displayResult).toBe('data:a');

    act(() => {
      result.current.onEnhanced('data:enhanced');
    });
    expect(result.current.displayResult).toBe('data:enhanced');

    rerender({ src: 'data:b' });
    expect(result.current.displayResult).toBe('data:b');
  });
});
