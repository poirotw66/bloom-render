/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generation history, backed by IndexedDB (see utils/historyDb.ts).
 *
 * Both the header's HistoryPanel and the full HistoryPage can be mounted at
 * the same time, so this is a small external store (React's
 * useSyncExternalStore) rather than per-component state: a delete in one
 * place is reflected in the other immediately, and both read the same
 * in-memory list instead of racing separate loads.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  MAX_HISTORY_ITEMS,
  clearHistoryItems,
  deleteHistoryItems,
  generateHistoryId,
  getAllHistoryItems,
  migrateLegacyHistoryIfNeeded,
  putHistoryItem,
  sortHistoryItems,
  splitOverflow,
  type HistoryItem,
} from '../utils/historyDb';
import { logger } from '../utils/logger';

export type { HistoryItem };

let history: HistoryItem[] = [];
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

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
        setHistory(await getAllHistoryItems());
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

  const item: HistoryItem = {
    id: generateHistoryId(type),
    type,
    result,
    timestamp: Date.now(),
    options,
  };
  const previous = history;
  setHistory(sortHistoryItems([item, ...previous]));

  try {
    await putHistoryItem(item);
    const { keep, overflow } = splitOverflow(history, MAX_HISTORY_ITEMS);
    if (overflow.length > 0) {
      setHistory(keep);
      await deleteHistoryItems(overflow.map((i) => i.id));
    }
  } catch (err) {
    logger.error('Failed to save history item:', err);
    // Roll back the optimistic add; the result wasn't actually persisted.
    setHistory(previous);
  }

  return item.id;
}

async function removeFromHistory(id: string): Promise<void> {
  const previous = history;
  setHistory(previous.filter((item) => item.id !== id));

  try {
    await deleteHistoryItems([id]);
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
