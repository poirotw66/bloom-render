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
let useHistoryStorageStatus: typeof import('./useHistory').useHistoryStorageStatus;
let getPendingHistoryItems: typeof import('./useHistory').getPendingHistoryItems;

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
  ({ useHistory, useHistoryStorageStatus, getPendingHistoryItems } = await import('./useHistory'));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('history store mutations', () => {
  it('subscribes to storage status without loading image history on the homepage', async () => {
    const { result } = renderHook(() => useHistoryStorageStatus());
    await act(async () => undefined);
    expect(getAllHistoryItems).not.toHaveBeenCalled();
    expect(result.current.issue).toBeNull();
  });

  it('retries a failed initial read without reloading and restores saved history', async () => {
    vi.mocked(getAllHistoryItems).mockRejectedValueOnce(new Error('Temporary storage failure'));
    const { result } = renderHook(() => ({
      store: useHistory(),
      status: useHistoryStorageStatus(),
    }));
    await waitFor(() => expect(result.current.status.issue?.operation).toBe('load'));
    vi.mocked(getAllHistoryItems).mockResolvedValue([stored('restored', 1)]);
    await act(async () => result.current.status.retryHistoryStorage());
    expect(result.current.store.history.map((item) => item.id)).toEqual(['restored']);
    expect(result.current.status.issue).toBeNull();
    expect(result.current.status.isRetrying).toBe(false);
  });

  it('retains a quota-failed image for download and retries the same stored key', async () => {
    vi.mocked(putHistoryItem).mockRejectedValueOnce(
      new DOMException('Storage full', 'QuotaExceededError'),
    );
    const { result } = renderHook(() => ({
      store: useHistory(),
      status: useHistoryStorageStatus(),
    }));
    let id!: string;
    await act(async () => {
      id = await result.current.store.addToHistory('portrait', IMAGE);
    });
    expect(result.current.store.history).toEqual([]);
    expect(result.current.status.issue?.kind).toBe('quota');
    expect(result.current.status.pendingCount).toBe(1);
    expect(getPendingHistoryItems()[0].id).toBe(id);
    expect(getPendingHistoryItems()[0].blob.type).toBe('image/png');
    await act(async () => result.current.status.retryHistoryStorage());
    expect(result.current.store.history.map((item) => item.id)).toEqual([id]);
    expect(vi.mocked(putHistoryItem).mock.calls.map(([item]) => item.id)).toEqual([id, id]);
    expect(result.current.status.pendingCount).toBe(0);
    expect(result.current.status.issue).toBeNull();
  });

  it('keeps pending images across failed reconnects and never evicts data to resolve quota', async () => {
    vi.mocked(getAllHistoryItems).mockResolvedValue([stored('old-2', 2), stored('old-1', 1)]);
    vi.mocked(putHistoryItem).mockRejectedValue(
      new DOMException('Storage full', 'QuotaExceededError'),
    );
    const { result } = renderHook(() => ({
      store: useHistory(),
      status: useHistoryStorageStatus(),
    }));
    await act(async () => {
      await result.current.store.addToHistory('portrait', IMAGE);
      await result.current.status.retryHistoryStorage();
    });
    expect(result.current.store.history.map((item) => item.id)).toEqual(['old-2', 'old-1']);
    expect(result.current.status.pendingCount).toBe(1);
    expect(deleteHistoryItems).not.toHaveBeenCalled();
    expect(clearHistoryItems).not.toHaveBeenCalled();
    vi.mocked(getAllHistoryItems).mockRejectedValue(new Error('Disconnected'));
    await act(async () => result.current.status.retryHistoryStorage());
    expect(result.current.status.pendingCount).toBe(1);
    expect(getPendingHistoryItems()).toHaveLength(1);
    expect(result.current.store.history).toHaveLength(2);
  });

  it('retains a generated image when history cannot initialize and saves after recovery', async () => {
    vi.mocked(getAllHistoryItems).mockRejectedValue(new Error('Disconnected'));
    const { result } = renderHook(() => ({
      store: useHistory(),
      status: useHistoryStorageStatus(),
    }));
    await act(async () => {
      await result.current.store.addToHistory('portrait', IMAGE);
    });
    expect(putHistoryItem).not.toHaveBeenCalled();
    expect(result.current.status.pendingCount).toBe(1);
    vi.mocked(getAllHistoryItems).mockResolvedValue([]);
    await act(async () => result.current.status.retryHistoryStorage());
    expect(putHistoryItem).toHaveBeenCalledOnce();
    expect(result.current.store.history).toHaveLength(1);
    expect(result.current.status.pendingCount).toBe(0);
    expect(result.current.status.issue).toBeNull();
  });

  it('shares repeated retry clicks and reconciles an already persisted pending key', async () => {
    vi.mocked(putHistoryItem).mockRejectedValueOnce(new Error('Uncertain commit'));
    const { result } = renderHook(() => ({
      store: useHistory(),
      status: useHistoryStorageStatus(),
    }));
    let id!: string;
    await act(async () => {
      id = await result.current.store.addToHistory('portrait', IMAGE);
    });
    const persisted = getPendingHistoryItems()[0];
    vi.mocked(getAllHistoryItems).mockResolvedValue([persisted]);
    await act(async () => {
      const first = result.current.status.retryHistoryStorage();
      const second = result.current.status.retryHistoryStorage();
      expect(first).toBe(second);
      await first;
    });
    expect(putHistoryItem).toHaveBeenCalledOnce();
    expect(result.current.store.history.map((item) => item.id)).toEqual([id]);
    expect(result.current.status.pendingCount).toBe(0);
  });

  it('does not immediately evict an older recovered image when newer history fills the cap', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1);
    vi.mocked(putHistoryItem).mockRejectedValueOnce(
      new DOMException('Storage full', 'QuotaExceededError'),
    );
    const { result } = renderHook(() => ({
      store: useHistory(),
      status: useHistoryStorageStatus(),
    }));
    let oldId!: string;
    await act(async () => {
      oldId = await result.current.store.addToHistory('portrait', IMAGE);
    });
    // Another tab saved newer images while this tab's image was pending.
    vi.mocked(getAllHistoryItems).mockResolvedValue([stored('newer-3', 3), stored('newer-2', 2)]);
    await act(async () => result.current.status.retryHistoryStorage());
    expect(result.current.store.history.map((item) => item.id)).toEqual([
      'newer-3',
      'newer-2',
      oldId,
    ]);
    expect(result.current.status.pendingCount).toBe(0);
    expect(deleteHistoryItems).not.toHaveBeenCalled();
  });

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
