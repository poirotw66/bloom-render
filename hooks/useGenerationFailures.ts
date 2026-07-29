/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tracks which slots of a multi-image generation failed, so the UI can report
 * "generated 2 of 4" and offer to re-run only the failed two.
 *
 * Every generation flow used to feed Promise.allSettled straight into
 * getFulfilledResults, which silently dropped rejections: asking for 4 images
 * and getting 2 looked identical to asking for 2. The API calls were still
 * billed, so the loss needs to be visible and recoverable.
 */

import { useCallback, useRef, useState } from 'react';
import {
  runIndexedTasks,
  type GenerationFailure,
  type SettledPartition,
} from '../utils/generationHelpers';

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
}

export interface UseGenerationFailuresResult extends GenerationRunState {
  /** Run the initial batch: one task per slot, 0..count-1. */
  runBatch: <T>(count: number, task: (index: number) => Promise<T>) => Promise<SettledPartition<T>>;
  /** Re-run only the slots that previously failed. */
  retryFailed: <T>(task: (index: number) => Promise<T>) => Promise<SettledPartition<T>>;
  reset: () => void;
}

const EMPTY_STATE: GenerationRunState = {
  failures: [],
  failedIndices: [],
  requestedCount: 0,
  succeededCount: 0,
  isRetrying: false,
};

export function useGenerationFailures(): UseGenerationFailuresResult {
  const [state, setState] = useState<GenerationRunState>(EMPTY_STATE);

  // retryFailed needs the current failed slots at call time without taking
  // failedIndices as a dependency (which would re-create the callback on every
  // run and churn every consumer's useCallback deps).
  const failedIndicesRef = useRef<number[]>([]);

  const runBatch = useCallback(
    async <T>(count: number, task: (index: number) => Promise<T>): Promise<SettledPartition<T>> => {
      const indices = Array.from({ length: count }, (_, i) => i);
      const partition = await runIndexedTasks(indices, task);
      const failedIndices = partition.failures.map((failure) => failure.index);
      failedIndicesRef.current = failedIndices;

      setState({
        failures: partition.failures,
        failedIndices,
        requestedCount: count,
        succeededCount: partition.results.length,
        isRetrying: false,
      });

      return partition;
    },
    [],
  );

  const retryFailed = useCallback(
    async <T>(task: (index: number) => Promise<T>): Promise<SettledPartition<T>> => {
      const indices = failedIndicesRef.current;
      if (indices.length === 0) return { results: [], failures: [] };

      setState((prev) => ({ ...prev, isRetrying: true }));

      try {
        const partition = await runIndexedTasks(indices, task);
        const failedIndices = partition.failures.map((failure) => failure.index);
        failedIndicesRef.current = failedIndices;

        setState((prev) => ({
          ...prev,
          failures: partition.failures,
          failedIndices,
          succeededCount: prev.succeededCount + partition.results.length,
          isRetrying: false,
        }));

        return partition;
      } catch (err) {
        setState((prev) => ({ ...prev, isRetrying: false }));
        throw err;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    failedIndicesRef.current = [];
    setState(EMPTY_STATE);
  }, []);

  return { ...state, runBatch, retryFailed, reset };
}
