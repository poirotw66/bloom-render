/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Owns one multi-image generation run: failed slots, retries, and client cancellation.
 * Aborting stops the client's wait; server-side work may still finish and be billed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  runIndexedTasks,
  type GenerationFailure,
  type SettledPartition,
} from '../utils/generationHelpers';

/** A task for one slot of the batch. The signal aborts when the user cancels. */
export type IndexedGenerationTask<T> = (index: number, signal: AbortSignal) => Promise<T>;

export interface GenerationRunOutcome<T> extends SettledPartition<T> {
  /** Cancelled or superseded runs have no results that callers should publish. */
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

type ActiveRun = { controller: AbortController; retry: boolean };

function cancelledOutcome<T>(): GenerationRunOutcome<T> {
  return { results: [], failures: [], cancelled: true };
}

/** Settle cancellation even if a provider ignores its signal; consume its late rejection. */
function waitForRun<T>(
  operation: Promise<SettledPartition<T>>,
  signal: AbortSignal,
): Promise<SettledPartition<T> | null> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      resolve(null);
    };
    operation.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function useGenerationFailures(): UseGenerationFailuresResult {
  const [state, setState] = useState<GenerationRunState>(EMPTY_STATE);
  const failedIndicesRef = useRef<number[]>([]);
  const activeRunRef = useRef<ActiveRun | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const run = activeRunRef.current;
      activeRunRef.current = null;
      run?.controller.abort();
    };
  }, []);

  const startRun = useCallback((retry: boolean): ActiveRun | null => {
    if (!mountedRef.current) return null;
    const previous = activeRunRef.current;
    activeRunRef.current = null;
    previous?.controller.abort();
    const run = { controller: new AbortController(), retry };
    activeRunRef.current = run;
    return run;
  }, []);

  const isCurrent = useCallback(
    (run: ActiveRun) =>
      mountedRef.current && activeRunRef.current === run && !run.controller.signal.aborted,
    [],
  );

  const finishRun = useCallback((run: ActiveRun) => {
    if (activeRunRef.current === run) activeRunRef.current = null;
  }, []);

  const runBatch = useCallback(
    async <T>(count: number, task: IndexedGenerationTask<T>): Promise<GenerationRunOutcome<T>> => {
      const run = startRun(false);
      if (!run) return cancelledOutcome();
      failedIndicesRef.current = [];
      setState({ ...EMPTY_STATE, requestedCount: count, isRunning: true });

      try {
        const indices = Array.from({ length: count }, (_, i) => i);
        const partition = await waitForRun(
          runIndexedTasks(indices, async (index) => {
            if (run.controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
            return task(index, run.controller.signal);
          }),
          run.controller.signal,
        );
        if (!partition || !isCurrent(run)) return cancelledOutcome();

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
        return { ...partition, cancelled: false };
      } catch (error) {
        if (!isCurrent(run)) return cancelledOutcome();
        setState(EMPTY_STATE);
        throw error;
      } finally {
        finishRun(run);
      }
    },
    [startRun, isCurrent, finishRun],
  );

  const retryFailed = useCallback(
    async <T>(task: IndexedGenerationTask<T>): Promise<GenerationRunOutcome<T>> => {
      if (!mountedRef.current) return cancelledOutcome();
      const indices = [...failedIndicesRef.current];
      if (indices.length === 0) return { results: [], failures: [], cancelled: false };

      const run = startRun(true);
      if (!run) return cancelledOutcome();
      setState((prev) => ({ ...prev, isRetrying: true, isRunning: true }));

      try {
        const partition = await waitForRun(
          runIndexedTasks(indices, async (index) => {
            if (run.controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
            return task(index, run.controller.signal);
          }),
          run.controller.signal,
        );
        if (!partition || !isCurrent(run)) return cancelledOutcome();

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
        return { ...partition, cancelled: false };
      } catch (error) {
        if (!isCurrent(run)) return cancelledOutcome();
        setState((prev) => ({ ...prev, isRetrying: false, isRunning: false }));
        throw error;
      } finally {
        finishRun(run);
      }
    },
    [startRun, isCurrent, finishRun],
  );

  const cancel = useCallback(() => {
    const run = activeRunRef.current;
    if (!run) return;
    activeRunRef.current = null;
    run.controller.abort();
    if (!run.retry) failedIndicesRef.current = [];
    if (mountedRef.current) {
      setState((prev) =>
        run.retry ? { ...prev, isRetrying: false, isRunning: false } : EMPTY_STATE,
      );
    }
  }, []);

  const reset = useCallback(() => {
    const run = activeRunRef.current;
    activeRunRef.current = null;
    run?.controller.abort();
    failedIndicesRef.current = [];
    if (mountedRef.current) setState(EMPTY_STATE);
  }, []);

  return useMemo(
    () => ({ ...state, runBatch, retryFailed, cancel, reset }),
    [state, runBatch, retryFailed, cancel, reset],
  );
}
