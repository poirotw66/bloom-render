/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared generation history and recoverable storage status.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  MAX_HISTORY_ITEMS,
  clearHistoryItems,
  dataUrlToBlob,
  deleteHistoryItems,
  generateHistoryId,
  getAllHistoryItems,
  getHistoryStorageErrorKind,
  migrateLegacyHistoryIfNeeded,
  putHistoryItem,
  sortHistoryItems,
  splitOverflow,
  type HistoryItem,
  type HistoryStorageErrorKind,
  type StoredHistoryItem,
} from '../utils/historyDb';
import { logger } from '../utils/logger';
import { recordGenerationSuccess } from '../utils/generationSuccess';

export type { HistoryItem };
export type HistoryStorageOperation = 'load' | 'save' | 'delete' | 'clear' | 'retention';
export interface HistoryStorageStatus {
  issue: { operation: HistoryStorageOperation; kind: HistoryStorageErrorKind } | null;
  pendingCount: number;
  isRetrying: boolean;
}

let history: HistoryItem[] = [];
let initialized = false;
let initPromise: Promise<void> | null = null;
let mutationQueue: Promise<void> = Promise.resolve();
let retryPromise: Promise<void> | null = null;
let storageStatus: HistoryStorageStatus = { issue: null, pendingCount: 0, isRetrying: false };
// Failed saves stay separate from persisted history and remain downloadable until retried.
const pendingWrites = new Map<string, StoredHistoryItem>();
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

function updateStorageStatus(update: Partial<HistoryStorageStatus> = {}): void {
  storageStatus = { ...storageStatus, ...update, pendingCount: pendingWrites.size };
  notify();
}

function reportFailure(operation: HistoryStorageOperation, error: unknown): void {
  logger.error(`History storage ${operation} failed:`, error);
  updateStorageStatus({ issue: { operation, kind: getHistoryStorageErrorKind(error) } });
}

function ensureInitialized(): Promise<void> {
  if (initialized) return Promise.resolve();
  if (!initPromise) {
    initPromise = Promise.resolve()
      .then(async () => {
        try {
          await migrateLegacyHistoryIfNeeded();
          const loaded = (await getAllHistoryItems()).map(withUrl);
          const previous = history;
          setHistory(loaded);
          revokeAll(previous);
          initialized = true;
          if (storageStatus.issue?.operation === 'load') updateStorageStatus({ issue: null });
        } catch (error) {
          reportFailure('load', error);
        }
      })
      .finally(() => {
        // A failed attempt must not prevent recovery without reloading the app.
        initPromise = null;
      });
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

function getStorageSnapshot(): HistoryStorageStatus {
  return storageStatus;
}

/** Serialize optimistic updates, rollbacks and retries with storage writes. */
function enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const next = mutationQueue.then(async () => {
    await ensureInitialized();
    return mutation();
  });
  mutationQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function trimHistory(): Promise<void> {
  const { keep, overflow } = splitOverflow(history, MAX_HISTORY_ITEMS);
  if (overflow.length === 0) {
    if (storageStatus.issue?.operation === 'retention') updateStorageStatus({ issue: null });
    return;
  }
  try {
    await deleteHistoryItems(overflow.map((item) => item.id));
    setHistory(keep);
    revokeAll(overflow);
    if (storageStatus.issue?.operation === 'retention') updateStorageStatus({ issue: null });
  } catch (error) {
    // A failed cleanup must not roll back a committed image or revoke usable URLs.
    reportFailure('retention', error);
  }
}

async function saveItem(stored: StoredHistoryItem, applyRetention = true): Promise<boolean> {
  if (!initialized) {
    pendingWrites.set(stored.id, stored);
    updateStorageStatus();
    return false;
  }
  const item = withUrl(stored);
  setHistory(sortHistoryItems([item, ...history]));
  try {
    await putHistoryItem(stored);
  } catch (error) {
    pendingWrites.set(stored.id, stored);
    setHistory(history.filter((entry) => entry.id !== item.id));
    revokeAll([item]);
    reportFailure('save', error);
    return false;
  }
  pendingWrites.delete(stored.id);
  updateStorageStatus({
    ...(pendingWrites.size === 0 && storageStatus.issue?.operation === 'save'
      ? { issue: null }
      : {}),
  });
  recordGenerationSuccess();
  if (applyRetention) await trimHistory();
  return true;
}

async function addToHistory(
  type: string,
  result: string,
  options?: Record<string, unknown>,
  source?: Blob | File | string | null,
): Promise<string> {
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
    await saveItem(stored);
    return stored.id;
  });
}

async function removeFromHistory(id: string): Promise<void> {
  return enqueueMutation(async () => {
    if (!initialized) return;
    const previous = history;
    const removed = previous.find((item) => item.id === id);
    setHistory(previous.filter((item) => item.id !== id));
    try {
      await deleteHistoryItems([id]);
      if (removed) revokeAll([removed]);
      if (storageStatus.issue?.operation === 'delete') updateStorageStatus({ issue: null });
    } catch (error) {
      setHistory(previous);
      reportFailure('delete', error);
    }
  });
}

async function clearHistory(): Promise<void> {
  return enqueueMutation(async () => {
    if (!initialized) return;
    const previous = history;
    setHistory([]);
    try {
      await clearHistoryItems();
      revokeAll(previous);
      if (storageStatus.issue?.operation === 'clear') updateStorageStatus({ issue: null });
    } catch (error) {
      setHistory(previous);
      reportFailure('clear', error);
    }
  });
}

/** Reconnect and retry unsaved images; never repeat an AI request or destructive UI action. */
function retryHistoryStorage(): Promise<void> {
  if (retryPromise) return retryPromise;
  updateStorageStatus({ isRetrying: true });
  retryPromise = enqueueMutation(async () => {
    if (!initialized) return;
    const retryRetention = storageStatus.issue?.operation === 'retention';
    // Reconcile committed rows first, including ambiguous failures and another tab's writes.
    try {
      const loaded = (await getAllHistoryItems()).map(withUrl);
      const previous = history;
      setHistory(loaded);
      revokeAll(previous);
      updateStorageStatus({ issue: null });
      const recoveringImages = pendingWrites.size > 0;
      for (const stored of pendingWrites.values()) {
        // Writing the same key is idempotent if a previous commit was uncertain.
        const existing = history.find((item) => item.id === stored.id);
        if (existing) {
          pendingWrites.delete(stored.id);
          updateStorageStatus();
        } else if (!(await saveItem(stored, false))) {
          break;
        }
      }
      // An older recovered image must not be evicted by its own save. When
      // recovering pending images, defer retention until the next new generation.
      if (!recoveringImages && retryRetention) await trimHistory();
    } catch (error) {
      reportFailure('load', error);
    }
  }).finally(() => {
    retryPromise = null;
    updateStorageStatus({ isRetrying: false });
  });
  return retryPromise;
}

/** Read pending blobs at click time; they are not persisted history rows. */
export function getPendingHistoryItems(): StoredHistoryItem[] {
  return [...pendingWrites.values()];
}

/** Status subscription does not load history or its image blobs on the upload homepage. */
export function useHistoryStorageStatus() {
  const status = useSyncExternalStore(subscribe, getStorageSnapshot, getStorageSnapshot);
  return { ...status, retryHistoryStorage };
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
