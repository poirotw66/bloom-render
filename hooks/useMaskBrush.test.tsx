// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMaskBrush } from './useMaskBrush';

describe('useMaskBrush', () => {
  it('records strokes and undoes the last stroke', () => {
    const { result } = renderHook(() =>
      useMaskBrush({ naturalWidth: 100, naturalHeight: 80, imageKey: 'a' }),
    );

    const rect = {
      left: 0,
      top: 0,
      width: 100,
      height: 80,
      right: 100,
      bottom: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;

    act(() => {
      result.current.beginStroke(10, 10, rect);
      result.current.continueStroke(20, 12, rect);
      result.current.endStroke();
    });
    expect(result.current.strokes).toHaveLength(1);
    expect(result.current.canUndoStroke).toBe(true);

    act(() => {
      result.current.beginStroke(40, 40, rect);
      result.current.endStroke();
    });
    expect(result.current.strokes).toHaveLength(2);

    act(() => {
      result.current.undoStroke();
    });
    expect(result.current.strokes).toHaveLength(1);

    act(() => {
      result.current.clearMask();
    });
    expect(result.current.strokes).toHaveLength(0);
    expect(result.current.canUndoStroke).toBe(false);
  });

  it('clamps brush size to the allowed range', () => {
    const { result } = renderHook(() =>
      useMaskBrush({ naturalWidth: 10, naturalHeight: 10, imageKey: 'b' }),
    );
    act(() => result.current.setBrushSize(2));
    expect(result.current.brushSize).toBe(8);
    act(() => result.current.setBrushSize(999));
    expect(result.current.brushSize).toBe(128);
  });
});
