/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorHistoryShortcuts } from './useEditorHistoryShortcuts';

function fireKey(init: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
}

describe('useEditorHistoryShortcuts', () => {
  it('undoes on Ctrl/Cmd+Z and redoes on Ctrl+Shift+Z / Ctrl+Y', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() =>
      useEditorHistoryShortcuts({
        canUndo: true,
        canRedo: true,
        onUndo,
        onRedo,
      }),
    );

    fireKey({ key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireKey({ key: 'z', ctrlKey: true, shiftKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);

    fireKey({ key: 'y', ctrlKey: true });
    expect(onRedo).toHaveBeenCalledTimes(2);

    fireKey({ key: 'z', metaKey: true });
    expect(onUndo).toHaveBeenCalledTimes(2);
  });

  it('ignores shortcuts when focus is in an input', () => {
    const onUndo = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useEditorHistoryShortcuts({
        canUndo: true,
        canRedo: true,
        onUndo,
        onRedo: vi.fn(),
      }),
    );

    fireKey({ key: 'z', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('does nothing when canUndo/canRedo are false', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() =>
      useEditorHistoryShortcuts({
        canUndo: false,
        canRedo: false,
        onUndo,
        onRedo,
      }),
    );

    fireKey({ key: 'z', ctrlKey: true });
    fireKey({ key: 'y', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });
});
