import { describe, expect, it, vi } from 'vitest';
import {
  getFulfilledResults,
  startRandomProgressTicker,
  type ProgressSetter,
} from './generationHelpers';

describe('generationHelpers', () => {
  describe('getFulfilledResults', () => {
    it('returns only fulfilled values', () => {
      const settled: PromiseSettledResult<number>[] = [
        { status: 'fulfilled', value: 1 },
        { status: 'rejected', reason: new Error('x') },
        { status: 'fulfilled', value: 3 },
      ];

      expect(getFulfilledResults(settled)).toEqual([1, 3]);
    });
  });

  describe('startRandomProgressTicker', () => {
    it('updates progress over time and stops correctly', () => {
      vi.useFakeTimers();
      const progress = { value: 0 };
      const setProgress: ProgressSetter = (updater) => {
        if (typeof updater === 'function') {
          progress.value = updater(progress.value);
        } else {
          progress.value = updater;
        }
      };

      const stop = startRandomProgressTicker(setProgress, {
        intervalMs: 10,
        maxBeforeDone: 10,
        randomStepMax: 10,
      });

      vi.advanceTimersByTime(30);
      expect(progress.value).toBeGreaterThan(0);
      expect(progress.value).toBeLessThanOrEqual(30);

      const valueBeforeStop = progress.value;
      stop();
      vi.advanceTimersByTime(100);
      expect(progress.value).toBe(valueBeforeStop);
      vi.useRealTimers();
    });
  });
});
