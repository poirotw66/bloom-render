import { describe, expect, it, vi } from 'vitest';
import {
  getFulfilledResults,
  isAbortError,
  groupFailureReasons,
  partitionSettled,
  runIndexedTasks,
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

  describe('partitionSettled', () => {
    it('separates results from failures and keeps the failing slot index', () => {
      const settled: PromiseSettledResult<string>[] = [
        { status: 'fulfilled', value: 'a' },
        { status: 'rejected', reason: new Error('boom') },
        { status: 'fulfilled', value: 'c' },
        { status: 'rejected', reason: new Error('bang') },
      ];

      const { results, failures } = partitionSettled(settled, [0, 1, 2, 3]);

      expect(results).toEqual(['a', 'c']);
      expect(failures.map((f) => f.index)).toEqual([1, 3]);
      expect((failures[0].reason as Error).message).toBe('boom');
    });

    it('maps back to original slots when only a subset was retried', () => {
      // A retry of slots 1 and 3 where slot 3 fails again.
      const settled: PromiseSettledResult<string>[] = [
        { status: 'fulfilled', value: 'recovered' },
        { status: 'rejected', reason: new Error('still failing') },
      ];

      const { results, failures } = partitionSettled(settled, [1, 3]);

      expect(results).toEqual(['recovered']);
      expect(failures.map((f) => f.index)).toEqual([3]);
    });

    it('reports no failures when everything succeeds', () => {
      const settled: PromiseSettledResult<number>[] = [
        { status: 'fulfilled', value: 1 },
        { status: 'fulfilled', value: 2 },
      ];

      expect(partitionSettled(settled, [0, 1]).failures).toEqual([]);
    });
  });

  describe('runIndexedTasks', () => {
    it('runs one task per index and reports which ones rejected', async () => {
      const { results, failures } = await runIndexedTasks([0, 1, 2], async (index) => {
        if (index === 1) throw new Error('slot 1 failed');
        return `ok-${index}`;
      });

      expect(results).toEqual(['ok-0', 'ok-2']);
      expect(failures).toHaveLength(1);
      expect(failures[0].index).toBe(1);
    });

    it('passes the original slot index through on a retry run', async () => {
      const seen: number[] = [];
      await runIndexedTasks([2, 5], async (index) => {
        seen.push(index);
        return index;
      });

      expect(seen).toEqual([2, 5]);
    });
  });

  describe('isAbortError', () => {
    it('recognises a DOM AbortError', () => {
      expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
    });

    it("recognises the SDK's wrapped abort error", () => {
      // What @google/genai actually throws when the signal fires.
      expect(
        isAbortError(new Error('exception AbortError: signal is aborted without reason')),
      ).toBe(true);
    });

    it('does not treat ordinary failures as cancellation', () => {
      expect(isAbortError(new Error('Request was blocked by the safety filter'))).toBe(false);
      expect(isAbortError('quota exceeded')).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });
  });

  describe('groupFailureReasons', () => {
    it('counts repeated reasons instead of listing duplicates', () => {
      const failures = [
        { index: 0, reason: new Error('error.safety_filter') },
        { index: 2, reason: new Error('error.safety_filter') },
        { index: 3, reason: new Error('error.quota_exceeded') },
      ];

      const grouped = groupFailureReasons(failures, (reason) => (reason as Error).message);

      expect(grouped).toEqual([
        { key: 'error.safety_filter', count: 2 },
        { key: 'error.quota_exceeded', count: 1 },
      ]);
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
