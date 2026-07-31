/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Owns one multi-image generation run: which slots failed, and cancelling it.
 *
 * Failures: every flow used to feed Promise.allSettled straight into
 * getFulfilledResults, which silently dropped rejections — asking for 4 images
 * and getting 2 looked identical to asking for 2. The API calls were still
 * billed, so the loss has to be visible and recoverable.
 *
 * Cancellation: a 4K run takes long enough that picking the wrong settings used
 * to mean waiting it out with no way back. runBatch/retryFailed hand each task
 * an AbortSignal and cancel() aborts it. Per the SDK, aborting is client-side
 * only: it stops the wait, not the server-side work, so usage is still billed.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  runIndexedTasks,
  type GenerationFailure,
  type SettledPartition,
} from '../utils/generationHelpers';

/** A task for one slot of the batch. The signal aborts when the user cancels. */
export type IndexedGenerationTask<T> = (index: number, signal: AbortSignal) => Promise<T>;

export interface GenerationRunOutcome<T> extends SettledPartition<T> {
  /** True when the user cancelled; callers should skip both error and partial UI. */
  cancelled: boolean;
}

export interface GenerationRunState {
  /** Failures from the most recent attempt (initial run or retry). */
  failures: GenerationFailure[];
  /** Slots still missing an image, in original batch order. */
  failedIndices: number[];
  /** How many images the user originally asked for. */
  requestedCount: number;
  /** How many succeeded so far, counting images recovered by retries. */
  succeededCount: number;
  isRetrying: boolean;
  /** True while a batch or retry is in flight, so the UI can offer to cancel. */
  isRunning: boolean;
}

export interface UseGenerationFailuresResult extends GenerationRunState {
  /** Run the initial batch: one task per slot, 0..count-1. */
  runBatch: <T>(count: number, task: IndexedGenerationTask<T>) => Promise<GenerationRunOutcome<T>>;
  /** Re-run only the slots that previously failed. */
  retryFailed: <T>(task: IndexedGenerationTask<T>) => Promise<GenerationRunOutcome<T>>;
  /** Abort the in-flight run. No-op when nothing is running. */
  cancel: () => void;
  reset: () => void;
}

const EMPTY_STATE: GenerationRunState = {
  failures: [],
  failedIndices: [],
  requestedCount: 0,
  succeededCount: 0,
  isRetrying: false,
  isRunning: false,
};

export function useGenerationFailures(): UseGenerationFailuresResult {
  const [state, setState] = useState<GenerationRunState>(EMPTY_STATE);

  // retryFailed needs the current failed slots at call time without taking
  // failedIndices as a dependency (which would re-create the callback on every
  // run and churn every consumer's useCallback deps).
  const failedIndicesRef = useRef<number[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const startRun = useCallback((): AbortController => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    cancelledRef.current = false;
    return controller;
  }, []);

  const finishRun = useCallback((controller: AbortController) => {
    if (controllerRef.current === controller) controllerRef.current = null;
  }, []);

  const runBatch = useCallback(
    async <T>(count: number, task: IndexedGenerationTask<T>): Promise<GenerationRunOutcome<T>> => {
      const controller = startRun();
      const indices = Array.from({ length: count }, (_, i) => i);

      setState({ ...EMPTY_STATE, requestedCount: count, isRunning: true });

      try {
        const partition = await runIndexedTasks(indices, (index) => task(index, controller.signal));
        const cancelled = cancelledRef.current;

        if (cancelled) {
          // Nothing partial to show or retry — the user asked to stop.
          failedIndicesRef.current = [];
          setState(EMPTY_STATE);
          return { ...partition, cancelled };
        }

        const failedIndices = partition.failures.map((failure) => failure.index);
        failedIndicesRef.current = failedIndices;

        setState({
          failures: partition.failures,
          failedIndices,
          requestedCount: count,
          succeededCount: partition.results.length,
          isRetrying: false,
          isRunning: false,
        });

        return { ...partition, cancelled };
      } finally {
        finishRun(controller);
      }
    },
    [startRun, finishRun],
  );

  const retryFailed = useCallback(
    async <T>(task: IndexedGenerationTask<T>): Promise<GenerationRunOutcome<T>> => {
      const indices = failedIndicesRef.current;
      if (indices.length === 0) return { results: [], failures: [], cancelled: false };

      const controller = startRun();
      setState((prev) => ({ ...prev, isRetrying: true, isRunning: true }));

      try {
        const partition = await runIndexedTasks(indices, (index) => task(index, controller.signal));
        const cancelled = cancelledRef.current;

        if (cancelled) {
          // Keep the failures so the retry button stays available.
          setState((prev) => ({ ...prev, isRetrying: false, isRunning: false }));
          return { ...partition, cancelled };
        }

        const failedIndices = partition.failures.map((failure) => failure.index);
        failedIndicesRef.current = failedIndices;

        setState((prev) => ({
          ...prev,
          failures: partition.failures,
          failedIndices,
          succeededCount: prev.succeededCount + partition.results.length,
          isRetrying: false,
          isRunning: false,
        }));

        return { ...partition, cancelled };
      } catch (err) {
        setState((prev) => ({ ...prev, isRetrying: false, isRunning: false }));
        throw err;
      } finally {
        finishRun(controller);
      }
    },
    [startRun, finishRun],
  );

  const cancel = useCallback(() => {
    if (!controllerRef.current) return;
    cancelledRef.current = true;
    controllerRef.current.abort();
  }, []);

  const reset = useCallback(() => {
    failedIndicesRef.current = [];
    cancelledRef.current = false;
    setState(EMPTY_STATE);
  }, []);

  // Memoised: consumers put this object in their useCallback dependency arrays,
  // so a fresh identity every render would rebuild their callbacks every render
  // and stop those dependency lists from gating anything.
  return useMemo(
    () => ({ ...state, runBatch, retryFailed, cancel, reset }),
    [state, runBatch, retryFailed, cancel, reset],
  );
}
