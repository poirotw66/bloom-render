// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBatchProcessing, type BatchProcessingOptions } from './useBatchProcessing';

const addToHistory = vi.fn(async () => 'history-id');
vi.mock('./useHistory', () => ({ useHistory: () => ({ addToHistory }) }));

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function options(
  generateApi: BatchProcessingOptions<string, object>['generateApi'],
): BatchProcessingOptions<string, object> {
  return {
    generateApi,
    options: {},
    settings: { provider: 'openrouter', apiKey: 'mock-key', model: 'mock-model' },
    maxConcurrent: 2,
    historyType: 'idphoto',
  };
}

beforeEach(() => addToHistory.mockClear());

describe('batch processing lifecycle', () => {
  it('publishes each settled result immediately with bounded concurrency and original order', async () => {
    const first = deferred();
    const second = deferred();
    const third = deferred();
    const generate = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    let pending!: ReturnType<typeof result.current.processBatch>;
    act(() => {
      pending = result.current.processBatch(['a', 'b', 'c'], options(generate));
    });
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
    await act(async () => second.resolve('image-b'));
    expect(result.current.results.map((item) => item.index)).toEqual([1]);
    expect(result.current.progress.completed).toBe(1);
    expect(result.current.isProcessing).toBe(true);
    expect(generate).toHaveBeenCalledTimes(3);
    await act(async () => {
      third.reject(new Error('Bad image'));
      first.resolve('image-a');
      await pending;
    });
    expect(result.current.results.map((item) => item.index)).toEqual([0, 1]);
    expect(result.current.errors.map((item) => item.index)).toEqual([2]);
    expect(result.current.progress.completed).toBe(3);
    expect(result.current.isProcessing).toBe(false);
    expect(addToHistory).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[0][2]).toEqual(
      expect.objectContaining({ provider: 'openrouter', abortSignal: expect.any(AbortSignal) }),
    );
  });

  it('cancels pending work, preserves finished results and ignores late providers', async () => {
    const first = deferred();
    const second = deferred();
    const third = deferred();
    const generate = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    const onComplete = vi.fn();
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    let pending!: ReturnType<typeof result.current.processBatch>;
    act(() => {
      pending = result.current.processBatch(['a', 'b', 'c', 'd'], {
        ...options(generate),
        onComplete,
      });
    });
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
    await act(async () => first.resolve('image-a'));
    act(() => result.current.cancel());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.cancelled).toBe(true);
    expect(generate.mock.calls.every((call) => call[2].abortSignal.aborted)).toBe(true);
    await act(async () => {
      second.resolve('late-b');
      third.resolve('late-c');
      expect((await pending).cancelled).toBe(true);
    });
    expect(generate).toHaveBeenCalledTimes(3);
    expect(result.current.results.map((item) => item.result)).toEqual(['image-a']);
    expect(result.current.progress.completed).toBe(1);
    expect(result.current.errors).toEqual([]);
    expect(addToHistory).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('aborts on unmount and does not launch queued work or save late results', async () => {
    const slot = deferred();
    const generate = vi.fn<BatchProcessingOptions<string, object>['generateApi']>(
      () => slot.promise,
    );
    const { result, unmount } = renderHook(() => useBatchProcessing<string, object>());
    let pending!: ReturnType<typeof result.current.processBatch>;
    act(() => {
      pending = result.current.processBatch(['a', 'b'], {
        ...options(generate),
        maxConcurrent: 1,
      });
    });
    await waitFor(() => expect(generate).toHaveBeenCalledOnce());
    unmount();
    expect(vi.mocked(generate).mock.calls[0][2].abortSignal?.aborted).toBe(true);
    slot.resolve('late');
    await pending;
    expect(generate).toHaveBeenCalledOnce();
    expect(addToHistory).not.toHaveBeenCalled();
  });

  it('does not let an old run overwrite a new run after reset', async () => {
    const old = deferred();
    const generate = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue('new-image');
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    let oldRun!: ReturnType<typeof result.current.processBatch>;
    act(() => {
      oldRun = result.current.processBatch(['old'], options(generate));
    });
    await waitFor(() => expect(generate).toHaveBeenCalledOnce());
    await act(async () => {
      result.current.reset();
      await result.current.processBatch(['new'], options(generate));
      old.resolve('stale-image');
      await oldRun;
    });
    expect(result.current.results.map((item) => item.result)).toEqual(['new-image']);
    expect(result.current.cancelled).toBe(false);
    expect(addToHistory).toHaveBeenCalledTimes(1);
  });

  it('shares a synchronously repeated start instead of submitting twice', async () => {
    const generate = vi.fn(async () => 'image');
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    await act(async () => {
      const first = result.current.processBatch(['a'], options(generate));
      const second = result.current.processBatch(['a'], options(generate));
      expect(first).toBe(second);
      await first;
    });
    expect(generate).toHaveBeenCalledOnce();
  });

  it('allows a completion callback to start the next batch', async () => {
    const generate = vi.fn(async (file: string) => `image-${file}`);
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    let nextRun!: ReturnType<typeof result.current.processBatch>;
    await act(async () => {
      const first = await result.current.processBatch(['a'], {
        ...options(generate),
        onComplete: () => {
          nextRun = result.current.processBatch(['b'], options(generate));
        },
      });
      expect(first.cancelled).toBe(false);
      await nextRun;
    });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(result.current.results.map((item) => item.result)).toEqual(['image-b']);
    expect(result.current.isProcessing).toBe(false);
  });

  it.each(['success', 'failure'] as const)(
    'does not overwrite a new run started from the previous %s callback',
    async (outcome) => {
      const nextSlot = deferred();
      const generate = vi.fn(async (file: string) => {
        if (file === 'new') return nextSlot.promise;
        if (outcome === 'failure') throw new Error('Old image failed');
        return 'old-image';
      });
      const onProgress = vi.fn();
      const { result } = renderHook(() => useBatchProcessing<string, object>());
      let nextRun!: ReturnType<typeof result.current.processBatch>;
      const startNext = () => {
        result.current.reset();
        nextRun = result.current.processBatch(['new'], options(generate));
      };
      await act(async () => {
        await result.current.processBatch(['old'], {
          ...options(generate),
          onItemComplete: startNext,
          onError: startNext,
          onProgress,
        });
      });
      expect(result.current.progress.completed).toBe(0);
      expect(result.current.isProcessing).toBe(true);
      expect(onProgress).not.toHaveBeenCalled();
      await act(async () => {
        nextSlot.resolve('new-image');
        await nextRun;
      });
      expect(result.current.results.map((item) => item.result)).toEqual(['new-image']);
      expect(result.current.progress.completed).toBe(1);
    },
  );

  it('does not submit work with an already aborted caller signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const generate = vi.fn(async () => 'image');
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    await act(async () => {
      await result.current.processBatch(['a'], {
        ...options(generate),
        settings: { abortSignal: controller.signal },
      });
    });
    expect(generate).not.toHaveBeenCalled();
    expect(result.current.cancelled).toBe(true);
  });

  it('clears the busy state if a consumer callback throws', async () => {
    const generate = vi.fn(async () => 'image');
    const { result } = renderHook(() => useBatchProcessing<string, object>());
    await act(async () => {
      await expect(
        result.current.processBatch(['a', 'b'], {
          ...options(generate),
          maxConcurrent: 1,
          onItemComplete: () => {
            throw new Error('Consumer failed');
          },
        }),
      ).rejects.toThrow('Consumer failed');
    });
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.results).toHaveLength(1);
    expect(result.current.errors).toEqual([]);
    expect(generate).toHaveBeenCalledOnce();
  });
});
