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
