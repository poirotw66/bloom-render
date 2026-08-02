/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared helpers for generation flows.
 */

export type ProgressSetter = (value: number | ((prev: number) => number)) => void;

interface RandomProgressOptions {
  intervalMs?: number;
  maxBeforeDone?: number;
  randomStepMax?: number;
}

/**
 * Start a random progress ticker that increases progress smoothly until maxBeforeDone.
 * Returns a stop function that clears the interval.
 */
export function startRandomProgressTicker(
  setProgress: ProgressSetter,
  options: RandomProgressOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? 500;
  const maxBeforeDone = options.maxBeforeDone ?? 90;
  const randomStepMax = options.randomStepMax ?? 10;

  const timerId = setInterval(() => {
    setProgress((prev) => {
      if (prev >= maxBeforeDone) return prev;
      return prev + Math.random() * randomStepMax;
    });
  }, intervalMs);

  return () => clearInterval(timerId);
}

/**
 * Extract fulfilled values from Promise.allSettled results.
 */
export function getFulfilledResults<T>(settled: PromiseSettledResult<T>[]): T[] {
  return settled
    .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
    .map((result) => result.value);
}

/**
 * True for a rejection caused by cancelling the run. The SDK wraps the DOM
 * AbortError in its own Error, so the name check alone isn't enough.
 */
export function isAbortError(reason: unknown): boolean {
  if (reason instanceof DOMException && reason.name === 'AbortError') return true;
  return reason instanceof Error && /abort/i.test(reason.message);
}

/** A single generation that failed, tagged with the slot it was generating for. */
export interface GenerationFailure {
  /** Index within the original requested batch, so a retry can re-run just this slot. */
  index: number;
  reason: unknown;
}

export interface SettledPartition<T> {
  results: T[];
  failures: GenerationFailure[];
}

/**
 * Split allSettled output into results and failures, keeping each failure's
 * original batch index.
 *
 * `indices` maps position in `settled` back to the requested slot: on the first
 * run that's 0..n-1, but a retry only re-runs the previously failed slots, so it
 * passes those indices instead.
 */
export function partitionSettled<T>(
  settled: PromiseSettledResult<T>[],
  indices: number[],
): SettledPartition<T> {
  const results: T[] = [];
  const failures: GenerationFailure[] = [];

  settled.forEach((outcome, position) => {
    const index = indices[position] ?? position;
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    } else {
      failures.push({ index, reason: outcome.reason });
    }
  });

  return { results, failures };
}

/** Run one task per requested slot, reporting per-slot failures instead of dropping them. */
export async function runIndexedTasks<T>(
  indices: number[],
  task: (index: number) => Promise<T>,
): Promise<SettledPartition<T>> {
  const settled = await Promise.allSettled(indices.map((index) => task(index)));
  return partitionSettled(settled, indices);
}

/**
 * The error to report when every slot in a batch failed.
 *
 * A whole batch failing almost always has one cause — no API key, a blocked
 * prompt, a quota wall — and that cause is already sitting in the first
 * rejection. Flattening it to "all generations failed" throws away the only
 * part the user can act on, so pass the real reason through and keep the
 * generic message for when there is genuinely nothing better to say.
 */
export function allFailedError(failures: GenerationFailure[]): Error {
  const reason = failures[0]?.reason;
  if (reason instanceof Error) return reason;
  return new Error('error.all_generations_failed');
}

/**
 * Group failures by their translated-message key so the UI can say
 * "2 blocked by the safety filter" rather than listing the same reason twice.
 */
export function groupFailureReasons(
  failures: GenerationFailure[],
  toKey: (reason: unknown) => string,
): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const failure of failures) {
    const key = toKey(failure.reason);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count }));
}
