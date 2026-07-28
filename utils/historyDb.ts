/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IndexedDB-backed storage for generation history.
 *
 * Results are full data URLs (a few hundred KB to several MB each at 2K/4K
 * output). localStorage's ~5-10MB quota meant history silently stopped
 * saving well before the old 50-item cap was reached. IndexedDB has no such
 * practical ceiling for this use case, so results are stored there; the
 * legacy localStorage blob is migrated once and then removed.
 */

import { logger } from './logger';

export interface HistoryItem {
  id: string;
  type: string;
  result: string;
  timestamp: number;
  options?: Record<string, unknown>;
}

export const MAX_HISTORY_ITEMS = 150;

const DB_NAME = 'bloomrender';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const LEGACY_STORAGE_KEY = 'pixshop_generation_history';

/** Newest first, matching how history has always been displayed. */
export function sortHistoryItems(items: HistoryItem[]): HistoryItem[] {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
}

/** Split an already-sorted (newest first) list at the retention cap. */
export function splitOverflow(
  items: HistoryItem[],
  max: number,
): { keep: HistoryItem[]; overflow: HistoryItem[] } {
  return { keep: items.slice(0, max), overflow: items.slice(max) };
}

export function generateHistoryId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Parses the legacy localStorage blob. Pure (takes the raw string rather than
 * reading localStorage itself) so it can be unit tested without a DOM.
 */
export function parseLegacyHistory(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = run(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function getAllHistoryItems(): Promise<HistoryItem[]> {
  const items = await runTransaction(
    'readonly',
    (store) => store.getAll() as IDBRequest<HistoryItem[]>,
  );
  return sortHistoryItems(items);
}

export async function putHistoryItem(item: HistoryItem): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(item));
}

export async function deleteHistoryItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearHistoryItems(): Promise<void> {
  await runTransaction('readwrite', (store) => store.clear());
}

/**
 * One-time move from the old localStorage blob into IndexedDB. Safe to call
 * on every load: it's a no-op once the legacy key is gone.
 */
export async function migrateLegacyHistoryIfNeeded(): Promise<void> {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (raw === null) return;

  const legacyItems = parseLegacyHistory(raw);
  try {
    for (const item of legacyItems) {
      await putHistoryItem(item);
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    logger.error('Failed to migrate legacy history into IndexedDB:', err);
    // Leave the legacy key in place so migration can retry on next load.
  }
}
