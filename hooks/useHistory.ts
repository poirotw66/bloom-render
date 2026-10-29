/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Generation history, backed by IndexedDB (see utils/historyDb.ts).
 *
 * Both the header's HistoryPanel and the routed HistoryPage can be mounted at
 * the same time, so this is a small external store (React's
 * useSyncExternalStore) rather than per-component state: a delete in one place
 * is reflected in the other immediately, and both read the same in-memory list
 * instead of racing separate loads.
 *
 * Results are Blobs; this module owns the object URL for each one, creating it
 * when an item enters the store and revoking it when the item leaves (delete,
 * clear, retention eviction, or a rolled-back write). Creating them here rather
 * than in render keeps components pure and guarantees exactly one URL per item.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  MAX_HISTORY_ITEMS,
  clearHistoryItems,
  dataUrlToBlob,
  deleteHistoryItems,
  generateHistoryId,
  getAllHistoryItems,
  migrateLegacyHistoryIfNeeded,
  putHistoryItem,
  sortHistoryItems,
  splitOverflow,
  type HistoryItem,
  type StoredHistoryItem,
} from '../utils/historyDb';
import { logger } from '../utils/logger';
import { recordGenerationSuccess } from '../utils/generationSuccess';

export type { HistoryItem };

let history: HistoryItem[] = [];
let initPromise: Promise<void> | null = null;
let mutationQueue: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function withUrl(item: StoredHistoryItem): HistoryItem {
  return {
    ...item,
    url: URL.createObjectURL(item.blob),
    sourceUrl: item.sourceBlob ? URL.createObjectURL(item.sourceBlob) : undefined,
  };
}

function revokeAll(items: HistoryItem[]): void {
  for (const item of items) {
    URL.revokeObjectURL(item.url);
    if (item.sourceUrl) URL.revokeObjectURL(item.sourceUrl);
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

function setHistory(next: HistoryItem[]): void {
  history = next;
  notify();
}

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await migrateLegacyHistoryIfNeeded();
        setHistory((await getAllHistoryItems()).map(withUrl));
      } catch (err) {
        logger.error('Failed to load history from IndexedDB:', err);
      }
    })();
  }
  return initPromise;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): HistoryItem[] {
  return history;
}

/** Keep optimistic updates and their rollbacks in the same order as storage writes. */
function enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const next = mutationQueue.then(async () => {
    await ensureInitialized();
    return mutation();
  });
  // A failed mutation must not prevent later writes from running.
  mutationQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function addToHistory(
  type: string,
  result: string,
  options?: Record<string, unknown>,
  source?: Blob | File | string | null,
): Promise<string> {
  // Demo mode uses pre-made samples — keep IndexedDB history for real generations only.
  // Still record a success so one-time UI (e.g. star nudge) can fire once.
  if (options?.provider === 'demo' || options?.demo === true) {
    recordGenerationSuccess();
    return `demo-skip-${type}`;
  }

  let sourceBlob: Blob | undefined;
  if (typeof source === 'string') {
    try {
      sourceBlob = dataUrlToBlob(source);
    } catch {
      sourceBlob = undefined;
    }
  } else if (source) {
    sourceBlob = source;
  }

  const stored: StoredHistoryItem = {
    id: generateHistoryId(type),
    type,
    blob: dataUrlToBlob(result),
    timestamp: Date.now(),
    options,
    sourceBlob,
  };
  return enqueueMutation(async () => {
    const item = withUrl(stored);
    setHistory(sortHistoryItems([item, ...history]));

    try {
      await putHistoryItem(stored);
    } catch (err) {
      logger.error('Failed to save history item:', err);
      setHistory(history.filter((entry) => entry.id !== item.id));
      revokeAll([item]);
      return item.id;
    }
    recordGenerationSuccess();

    const { keep, overflow } = splitOverflow(history, MAX_HISTORY_ITEMS);
    if (overflow.length > 0) {
      try {
        await deleteHistoryItems(overflow.map((evicted) => evicted.id));
        setHistory(keep);
        revokeAll(overflow);
      } catch (err) {
        // The new image is saved. Keep usable URLs and retry retention on the next add.
        logger.error('Failed to remove expired history items:', err);
      }
    }

    return item.id;
  });
}

async function removeFromHistory(id: string): Promise<void> {
  return enqueueMutation(async () => {
    const previous = history;
    const removed = previous.find((item) => item.id === id);
    setHistory(previous.filter((item) => item.id !== id));

    try {
      await deleteHistoryItems([id]);
      if (removed) revokeAll([removed]);
    } catch (err) {
      logger.error('Failed to delete history item:', err);
      setHistory(previous);
    }
  });
}

async function clearHistory(): Promise<void> {
  return enqueueMutation(async () => {
    const previous = history;
    setHistory([]);

    try {
      await clearHistoryItems();
      revokeAll(previous);
    } catch (err) {
      logger.error('Failed to clear history:', err);
      setHistory(previous);
    }
  });
}

export function useHistory() {
  useEffect(() => {
    void ensureInitialized();
  }, []);

  const historyState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const getHistoryByType = useCallback(
    (type: string) => historyState.filter((item) => item.type === type),
    [historyState],
  );

  return {
    history: historyState,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryByType,
  };
}
