// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared by all six generation flows plus model comparison: a regression here
 * breaks every one of them at once. See the header comment on
 * useGenerationFailures.ts for what this hook owns and why.
 */

import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement, StrictMode, type ReactNode } from 'react';
import { useGenerationFailures, type IndexedGenerationTask } from './useGenerationFailures';

/** A task that resolves/rejects per index, and never settles until released. */
function deferredTask<T>() {
  const pending = new Map<number, { resolve: (v: T) => void; reject: (e: unknown) => void }>();
  const seenIndices: number[] = [];

  const task: IndexedGenerationTask<T> = (index) => {
    seenIndices.push(index);
    return new Promise<T>((resolve, reject) => {
      pending.set(index, { resolve, reject });
    });
  };

  return {
    task,
    seenIndices,
    resolve: (index: number, value: T) => pending.get(index)?.resolve(value),
    reject: (index: number, reason: unknown) => pending.get(index)?.reject(reason),
  };
}

describe('useGenerationFailures', () => {
  describe('runBatch', () => {
    it('partitions results and failures, tagging each failure with its original slot index', async () => {
      const { result } = renderHook(() => useGenerationFailures());

      const task: IndexedGenerationTask<string> = async (index) => {
        if (index === 1 || index === 3) throw new Error(`slot ${index} failed`);
        return `ok-${index}`;
      };

      let outcome!: Awaited<ReturnType<typeof result.current.runBatch<string>>>;
      await act(async () => {
        outcome = await result.current.runBatch(4, task);
      });

      expect(outcome.results).toEqual(['ok-0', 'ok-2']);
      expect(outcome.failures.map((f) => f.index)).toEqual([1, 3]);
      expect(result.current.failedIndices).toEqual([1, 3]);
      expect(result.current.succeededCount).toBe(2);
    });
  });

  describe('retryFailed', () => {
    it('re-runs only the previously-failed slots, passing their original indices', async () => {
      // The subtle regression: a naive retry re-runs 0..failures.length-1
      // instead of the actual failed slots, so a retry of [1, 3] would call
      // the task with 0 and 1 — silently regenerating the wrong images.
      const { result } = renderHook(() => useGenerationFailures());

      const initialTask: IndexedGenerationTask<string> = async (index) => {
        if (index === 1 || index === 3) throw new Error(`slot ${index} failed`);
        return `ok-${index}`;
      };
      await act(async () => {
        await result.current.runBatch(4, initialTask);
      });
      expect(result.current.failedIndices).toEqual([1, 3]);

      const seenOnRetry: number[] = [];
      const retryTask: IndexedGenerationTask<string> = async (index) => {
        seenOnRetry.push(index);
        return `retried-${index}`;
      };

      let retryOutcome!: Awaited<ReturnType<typeof result.current.retryFailed<string>>>;
      await act(async () => {
        retryOutcome = await result.current.retryFailed(retryTask);
      });

      expect(seenOnRetry).toEqual([1, 3]);
      expect(retryOutcome.results).toEqual(['retried-1', 'retried-3']);
    });

    it('accumulates succeededCount across a retry rather than resetting it', async () => {
      const { result } = renderHook(() => useGenerationFailures());

      await act(async () => {
        await result.current.runBatch(3, async (index) => {
          if (index === 2) throw new Error('slot 2 failed');
          return `ok-${index}`;
        });
      });
      expect(result.current.succeededCount).toBe(2);

      await act(async () => {
        await result.current.retryFailed(async (index) => `recovered-${index}`);
      });

      // 2 from the initial run + 1 recovered on retry, not reset to 1.
      expect(result.current.succeededCount).toBe(3);
      expect(result.current.failedIndices).toEqual([]);
    });
  });

  describe('cancel', () => {
    it('marks the outcome cancelled and clears results/failures for an initial run', async () => {
      const { result } = renderHook(() => useGenerationFailures());
      const d = deferredTask<string>();

      let outcomePromise!: Promise<Awaited<ReturnType<typeof result.current.runBatch<string>>>>;
      act(() => {
        outcomePromise = result.current.runBatch(2, d.task);
      });

      act(() => {
        result.current.cancel();
      });
      // A provider may reject after the hook has already settled cancellation.
      d.reject(0, new DOMException('aborted', 'AbortError'));
      d.reject(1, new DOMException('aborted', 'AbortError'));

      const outcome = await act(async () => outcomePromise);

      expect(outcome.cancelled).toBe(true);
      // Deliberate design: a cancelled *initial* run reports nothing partial
      // and nothing to retry, since the user asked to stop, not to see what
      // half-finished.
      expect(result.current.failures).toEqual([]);
      expect(result.current.failedIndices).toEqual([]);
    });

    it('keeps existing failures after a cancelled retry, so the retry button stays available', async () => {
      const { result } = renderHook(() => useGenerationFailures());

      await act(async () => {
        await result.current.runBatch(3, async (index) => {
          if (index === 1) throw new Error('slot 1 failed');
          return `ok-${index}`;
        });
      });
      expect(result.current.failedIndices).toEqual([1]);

      const d = deferredTask<string>();
      let retryPromise!: Promise<Awaited<ReturnType<typeof result.current.retryFailed<string>>>>;
      act(() => {
        retryPromise = result.current.retryFailed(d.task);
      });

      act(() => {
        result.current.cancel();
      });
      d.reject(1, new DOMException('aborted', 'AbortError'));

      const outcome = await act(async () => retryPromise);

      expect(outcome.cancelled).toBe(true);
      // Differs from a cancelled initial run on purpose: retryFailed's cancel
      // branch spreads `prev` instead of resetting to EMPTY_STATE, so the
      // failed slot from before the retry is still there to retry again.
      expect(result.current.failedIndices).toEqual([1]);
      expect(result.current.failures).toHaveLength(1);
    });
  });

  describe('object identity', () => {
    it('stays stable across a re-render when state has not changed', () => {
      // Consumers (e.g. useTravel) put this object in their own useCallback
      // dependency arrays. A fresh identity every render defeats that gating
      // and forces every dependent callback to rebuild every render — this
      // exact bug shipped once already.
      const { result, rerender } = renderHook(() => useGenerationFailures());

      const first = result.current;
      rerender();
      const second = result.current;

      expect(second).toBe(first);
    });

    it('produces a new identity when state actually changes', async () => {
      const { result } = renderHook(() => useGenerationFailures());
      const first = result.current;

      await act(async () => {
        await result.current.runBatch(1, async () => 'ok');
      });

      expect(result.current).not.toBe(first);
    });
  });

  describe('reset', () => {
    it('clears failures and succeededCount back to empty state', async () => {
      const { result } = renderHook(() => useGenerationFailures());

      await act(async () => {
        await result.current.runBatch(2, async (index) => {
          if (index === 0) throw new Error('slot 0 failed');
          return `ok-${index}`;
        });
      });
      expect(result.current.failedIndices).toEqual([0]);

      act(() => {
        result.current.reset();
      });

      expect(result.current.failedIndices).toEqual([]);
      expect(result.current.succeededCount).toBe(0);
      expect(result.current.requestedCount).toBe(0);
    });
  });
});

describe('generation run isolation', () => {
  it('accepts new work after StrictMode replays mount cleanup', async () => {
    const { result } = renderHook(() => useGenerationFailures(), {
      wrapper: ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children),
    });
    await act(async () => {
      const outcome = await result.current.runBatch(1, async () => 'strict-mode-image');
      expect(outcome.cancelled).toBe(false);
      expect(outcome.results).toEqual(['strict-mode-image']);
    });
    expect(result.current.succeededCount).toBe(1);
  });

  it('settles cancellation promptly even when the provider never observes its signal', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    const pending = deferredTask<string>();
    let operation!: ReturnType<typeof result.current.runBatch<string>>;
    act(() => {
      operation = result.current.runBatch(2, pending.task);
      result.current.cancel();
    });
    expect(result.current.isRunning).toBe(false);
    expect(await act(async () => operation)).toEqual({
      results: [],
      failures: [],
      cancelled: true,
    });
    // Late failures remain handled even though the original operation has resolved.
    await act(async () => {
      pending.reject(0, new Error('Late network failure'));
      pending.resolve(1, 'late-image');
    });
    expect(result.current.requestedCount).toBe(0);
  });

  it('does not let cancelled responses overwrite a newer pending batch', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    const old = deferredTask<string>();
    const current = deferredTask<string>();
    let oldRun!: ReturnType<typeof result.current.runBatch<string>>;
    let currentRun!: ReturnType<typeof result.current.runBatch<string>>;
    act(() => {
      oldRun = result.current.runBatch(2, old.task);
      result.current.cancel();
      currentRun = result.current.runBatch(1, current.task);
    });
    await act(async () => {
      old.resolve(0, 'old-success');
      old.reject(1, new Error('Old failure'));
      expect((await oldRun).cancelled).toBe(true);
    });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.requestedCount).toBe(1);
    expect(result.current.failedIndices).toEqual([]);
    expect(result.current.succeededCount).toBe(0);
    await act(async () => {
      current.resolve(0, 'current-success');
      expect((await currentRun).results).toEqual(['current-success']);
    });
    expect(result.current.succeededCount).toBe(1);
  });

  it('supersedes a run without explicit cancellation and preserves the new failure indices', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    const old = deferredTask<string>();
    let oldSignal!: AbortSignal;
    let oldRun!: ReturnType<typeof result.current.runBatch<string>>;
    act(() => {
      oldRun = result.current.runBatch(1, (index, signal) => {
        oldSignal = signal;
        return old.task(index, signal);
      });
    });
    await act(async () => {
      await result.current.runBatch(3, async (index) => {
        if (index === 2) throw new Error('Current slot 2 failed');
        return `current-${index}`;
      });
    });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
      old.resolve(0, 'late-old');
      expect((await oldRun).cancelled).toBe(true);
    });
    expect(result.current.failedIndices).toEqual([2]);
    expect(result.current.requestedCount).toBe(3);
    expect(result.current.succeededCount).toBe(2);
  });

  it('reset aborts the active request and late completion cannot repopulate the cleared state', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    const pending = deferredTask<string>();
    let signal!: AbortSignal;
    let operation!: ReturnType<typeof result.current.runBatch<string>>;
    act(() => {
      operation = result.current.runBatch(1, (index, value) => {
        signal = value;
        return pending.task(index, value);
      });
      result.current.reset();
    });
    expect(signal.aborted).toBe(true);
    await act(async () => {
      expect((await operation).cancelled).toBe(true);
      pending.resolve(0, 'late-image');
    });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.requestedCount).toBe(0);
    expect(result.current.succeededCount).toBe(0);
  });

  it('does not publish a stale retry into a newer batch', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    await act(async () => {
      await result.current.runBatch(3, async (index) => {
        if (index === 1) throw new Error('Retry me');
        return `initial-${index}`;
      });
    });
    const retry = deferredTask<string>();
    let retryRun!: ReturnType<typeof result.current.retryFailed<string>>;
    act(() => {
      retryRun = result.current.retryFailed(retry.task);
    });
    await act(async () => {
      await result.current.runBatch(2, async (index) => {
        if (index === 0) throw new Error('New slot failed');
        return 'new-success';
      });
      retry.resolve(1, 'old-recovered');
      expect((await retryRun).cancelled).toBe(true);
    });
    expect(result.current.requestedCount).toBe(2);
    expect(result.current.succeededCount).toBe(1);
    expect(result.current.failedIndices).toEqual([0]);
  });

  it('keeps retryable failures and prior successes when cancelling an unresponsive retry', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    await act(async () => {
      await result.current.runBatch(2, async (index) => {
        if (index === 1) throw new Error('Retry me');
        return 'initial-success';
      });
    });
    const pending = deferredTask<string>();
    let retryRun!: ReturnType<typeof result.current.retryFailed<string>>;
    act(() => {
      retryRun = result.current.retryFailed(pending.task);
      result.current.cancel();
    });
    await act(async () => {
      expect((await retryRun).cancelled).toBe(true);
    });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.failedIndices).toEqual([1]);
    expect(result.current.succeededCount).toBe(1);
    await act(async () => {
      const recovered = await result.current.retryFailed(async () => 'new-recovered');
      expect(recovered.results).toEqual(['new-recovered']);
      pending.reject(1, new Error('Late old failure'));
    });
    expect(result.current.succeededCount).toBe(2);
    expect(result.current.failedIndices).toEqual([]);
  });

  it('aborts on unmount and prevents saved callbacks from starting new work afterward', async () => {
    const { result, unmount } = renderHook(() => useGenerationFailures());
    const pending = deferredTask<string>();
    let signal!: AbortSignal;
    let operation!: ReturnType<typeof result.current.runBatch<string>>;
    const callbacks = result.current;
    act(() => {
      operation = callbacks.runBatch(1, (index, value) => {
        signal = value;
        return pending.task(index, value);
      });
    });
    unmount();
    expect(signal.aborted).toBe(true);
    expect((await operation).cancelled).toBe(true);
    const task = vi.fn(async () => 'must-not-start');
    expect((await callbacks.runBatch(1, task)).cancelled).toBe(true);
    expect((await callbacks.retryFailed(task)).cancelled).toBe(true);
    expect(task).not.toHaveBeenCalled();
    pending.reject(0, new Error('Late failure after unmount'));
    await Promise.resolve();
  });

  it('removes cancellation listeners after completion and cancellation', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    const pending = deferredTask<string>();
    let removeListener!: ReturnType<typeof vi.spyOn>;
    let operation!: ReturnType<typeof result.current.runBatch<string>>;
    act(() => {
      operation = result.current.runBatch(1, (index, signal) => {
        removeListener = vi.spyOn(signal, 'removeEventListener');
        return pending.task(index, signal);
      });
    });
    await act(async () => {
      pending.resolve(0, 'success');
      await operation;
    });
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    const cancelled = deferredTask<string>();
    act(() => {
      operation = result.current.runBatch(1, (index, signal) => {
        removeListener = vi.spyOn(signal, 'removeEventListener');
        return cancelled.task(index, signal);
      });
      result.current.cancel();
    });
    await act(async () => operation);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('partitions synchronously thrown task failures without leaving a run stuck', async () => {
    const { result } = renderHook(() => useGenerationFailures());
    await act(async () => {
      const outcome = await result.current.runBatch(2, (index) => {
        if (index === 0) throw new Error('Synchronous task failure');
        return Promise.resolve('success');
      });
      expect(outcome.results).toEqual(['success']);
      expect(outcome.failures.map((failure) => failure.index)).toEqual([0]);
    });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.succeededCount).toBe(1);
  });
});
