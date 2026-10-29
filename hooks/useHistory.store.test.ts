// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearHistoryItems,
  deleteHistoryItems,
  getAllHistoryItems,
  putHistoryItem,
  type StoredHistoryItem,
} from '../utils/historyDb';

vi.mock('../utils/historyDb', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/historyDb')>()),
  MAX_HISTORY_ITEMS: 2,
  migrateLegacyHistoryIfNeeded: vi.fn(async () => undefined),
  getAllHistoryItems: vi.fn(async () => []),
  putHistoryItem: vi.fn(async () => undefined),
  deleteHistoryItems: vi.fn(async () => undefined),
  clearHistoryItems: vi.fn(async () => undefined),
}));
vi.mock('../utils/logger', () => ({ logger: { error: vi.fn() } }));

const IMAGE = 'data:image/png;base64,eA==';
let useHistory: typeof import('./useHistory').useHistory;

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function stored(id: string, timestamp: number): StoredHistoryItem {
  return { id, timestamp, type: 'portrait', blob: new Blob(['x']), sourceBlob: new Blob(['s']) };
}

beforeEach(async () => {
  vi.resetModules();
  vi.mocked(getAllHistoryItems).mockReset().mockResolvedValue([]);
  vi.mocked(putHistoryItem).mockReset().mockResolvedValue(undefined);
  vi.mocked(deleteHistoryItems).mockReset().mockResolvedValue(undefined);
  vi.mocked(clearHistoryItems).mockReset().mockResolvedValue(undefined);
  let url = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test-${++url}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  ({ useHistory } = await import('./useHistory'));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('history store mutations', () => {
  it('preserves a successful queued add after the preceding add fails', async () => {
    const pending = deferred();
    vi.mocked(putHistoryItem).mockImplementationOnce(() => pending.promise);
    const { result } = renderHook(() => useHistory());
    let first!: Promise<string>;
    let second!: Promise<string>;
    act(() => {
      first = result.current.addToHistory('portrait', IMAGE, undefined, new Blob(['source']));
      second = result.current.addToHistory('portrait', IMAGE);
    });
    await waitFor(() => expect(putHistoryItem).toHaveBeenCalledTimes(1));
    await act(async () => {
      pending.reject(new Error('Quota exceeded'));
      await Promise.all([first, second]);
    });
    expect(result.current.history.map((item) => item.id)).toEqual([await second]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-1');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-2');
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(result.current.history[0].url);
  });

  it.each(['remove', 'clear'] as const)(
    'preserves an add queued behind a failed %s',
    async (operation) => {
      vi.mocked(getAllHistoryItems).mockResolvedValue([stored('old', 1)]);
      const pending = deferred();
      if (operation === 'remove') {
        vi.mocked(deleteHistoryItems).mockImplementationOnce(() => pending.promise);
      } else {
        vi.mocked(clearHistoryItems).mockImplementationOnce(() => pending.promise);
      }
      const { result } = renderHook(() => useHistory());
      await waitFor(() => expect(result.current.history).toHaveLength(1));
      let mutation!: Promise<void>;
      let addition!: Promise<string>;
      act(() => {
        mutation =
          operation === 'remove'
            ? result.current.removeFromHistory('old')
            : result.current.clearHistory();
        addition = result.current.addToHistory('portrait', IMAGE);
      });
      await waitFor(() => expect(result.current.history).toHaveLength(0));
      await act(async () => {
        pending.reject(new Error('Storage failed'));
        await Promise.all([mutation, addition]);
      });
      expect(result.current.history.map((item) => item.id)).toEqual([await addition, 'old']);
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    },
  );

  it('waits for initial history loading before clearing it', async () => {
    let finishLoad!: (items: StoredHistoryItem[]) => void;
    vi.mocked(getAllHistoryItems).mockReturnValue(
      new Promise((resolve) => {
        finishLoad = resolve;
      }),
    );
    const { result } = renderHook(() => useHistory());
    let clearing!: Promise<void>;
    act(() => {
      clearing = result.current.clearHistory();
    });
    await waitFor(() => expect(getAllHistoryItems).toHaveBeenCalled());
    expect(clearHistoryItems).not.toHaveBeenCalled();
    await act(async () => {
      finishLoad([stored('old', 1)]);
      await clearing;
    });
    expect(result.current.history).toEqual([]);
    expect(clearHistoryItems).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('keeps a saved add and usable URLs if retention cleanup fails, then retries cleanup', async () => {
    vi.mocked(getAllHistoryItems).mockResolvedValue([stored('old-2', 2), stored('old-1', 1)]);
    vi.mocked(deleteHistoryItems).mockRejectedValueOnce(new Error('Delete failed'));
    const { result } = renderHook(() => useHistory());
    await waitFor(() => expect(result.current.history).toHaveLength(2));
    let firstId!: string;
    await act(async () => {
      firstId = await result.current.addToHistory('portrait', IMAGE);
    });
    expect(result.current.history.map((item) => item.id)).toEqual([firstId, 'old-2', 'old-1']);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    let secondId!: string;
    await act(async () => {
      secondId = await result.current.addToHistory('portrait', IMAGE);
    });
    expect(new Set(result.current.history.map((item) => item.id))).toEqual(
      new Set([firstId, secondId]),
    );
    expect(deleteHistoryItems).toHaveBeenLastCalledWith(['old-2', 'old-1']);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(4);
  });

  it('does not persist demo results', async () => {
    const { result } = renderHook(() => useHistory());
    await act(async () => {
      await result.current.addToHistory('portrait', IMAGE, { provider: 'demo' });
    });
    expect(putHistoryItem).not.toHaveBeenCalled();
    expect(result.current.history).toEqual([]);
  });
});
