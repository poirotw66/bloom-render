// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGenerationAttempt, type GenerationAttempt } from './useGenerationAttempt';

describe('generation caller attempts', () => {
  it('supersedes preparation and timers without letting an old finally clean up a new attempt', () => {
    const oldCleanup = vi.fn();
    const newCleanup = vi.fn();
    const { result } = renderHook(() => useGenerationAttempt());
    let old!: GenerationAttempt;
    let current!: GenerationAttempt;
    act(() => {
      old = result.current.begin();
      old.onCleanup(oldCleanup);
      current = result.current.begin();
      current.onCleanup(newCleanup);
      result.current.finish(old);
    });
    expect(old.signal.aborted).toBe(true);
    expect(old.isCurrent()).toBe(false);
    expect(oldCleanup).toHaveBeenCalledOnce();
    expect(current.isCurrent()).toBe(true);
    expect(newCleanup).not.toHaveBeenCalled();
    act(() => result.current.finish(current));
    expect(newCleanup).toHaveBeenCalledOnce();
    expect(current.isCurrent()).toBe(false);
  });

  it('cleans up preparation on unmount and immediately releases late registered resources', () => {
    const cleanup = vi.fn();
    const lateCleanup = vi.fn();
    const { result, unmount } = renderHook(() => useGenerationAttempt());
    const attempt = result.current.begin();
    attempt.onCleanup(cleanup);
    unmount();
    expect(attempt.signal.aborted).toBe(true);
    expect(attempt.isCurrent()).toBe(false);
    expect(cleanup).toHaveBeenCalledOnce();
    attempt.onCleanup(lateCleanup);
    expect(lateCleanup).toHaveBeenCalledOnce();
  });

  it('does not clean up a finished attempt twice when later cancelled', () => {
    const cleanup = vi.fn();
    const { result } = renderHook(() => useGenerationAttempt());
    const attempt = result.current.begin();
    attempt.onCleanup(cleanup);
    result.current.finish(attempt);
    result.current.cancel();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('returns an already aborted attempt when a saved begin callback runs after unmount', () => {
    const { result, unmount } = renderHook(() => useGenerationAttempt());
    const begin = result.current.begin;
    unmount();
    const attempt = begin();
    const cleanup = vi.fn();
    expect(attempt.signal.aborted).toBe(true);
    expect(attempt.isCurrent()).toBe(false);
    attempt.onCleanup(cleanup);
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
