/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

export type { HistoryItem };

let history: HistoryItem[] = [];
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function withUrl(item: StoredHistoryItem): HistoryItem {
  return { ...item, url: URL.createObjectURL(item.blob) };
}

function revokeAll(items: HistoryItem[]): void {
  for (const item of items) URL.revokeObjectURL(item.url);
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

async function addToHistory(
  type: string,
  result: string,
  options?: Record<string, unknown>,
): Promise<string> {
  await ensureInitialized();

  const stored: StoredHistoryItem = {
    id: generateHistoryId(type),
    type,
    blob: dataUrlToBlob(result),
    timestamp: Date.now(),
    options,
  };
  const item = withUrl(stored);
  const previous = history;
  setHistory(sortHistoryItems([item, ...previous]));

  try {
    await putHistoryItem(stored);

    const { keep, overflow } = splitOverflow(history, MAX_HISTORY_ITEMS);
    if (overflow.length > 0) {
      setHistory(keep);
      revokeAll(overflow);
      await deleteHistoryItems(overflow.map((evicted) => evicted.id));
    }
  } catch (err) {
    logger.error('Failed to save history item:', err);
    // Roll back the optimistic add; the result wasn't actually persisted.
    setHistory(previous);
    URL.revokeObjectURL(item.url);
  }

  return item.id;
}

async function removeFromHistory(id: string): Promise<void> {
  const previous = history;
  const removed = previous.find((item) => item.id === id);
  setHistory(previous.filter((item) => item.id !== id));

  try {
    await deleteHistoryItems([id]);
    if (removed) URL.revokeObjectURL(removed.url);
  } catch (err) {
    logger.error('Failed to delete history item:', err);
    setHistory(previous);
  }
}

async function clearHistory(): Promise<void> {
  const previous = history;
  setHistory([]);

  try {
    await clearHistoryItems();
    revokeAll(previous);
  } catch (err) {
    logger.error('Failed to clear history:', err);
    setHistory(previous);
  }
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
