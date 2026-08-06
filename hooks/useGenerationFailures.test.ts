// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared by all six generation flows plus model comparison: a regression here
 * breaks every one of them at once. See the header comment on
 * useGenerationFailures.ts for what this hook owns and why.
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
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
      // The AbortSignal cancel() fires doesn't itself reject the task promises;
      // the task is responsible for observing the signal. Simulate that here.
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
