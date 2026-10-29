/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * IndexedDB-backed storage for generation history.
 *
 * Results are stored as Blobs rather than base64 data URLs. A data URL is
 * ~33% larger than the bytes it encodes, and — more importantly — it is a JS
 * string, so the whole history sat in the JS heap: 40 stored 2K results took
 * the heap from 34 MB to 448 MB. Blobs are held by the browser outside the
 * heap and can be backed by disk, and the UI renders them through object URLs.
 *
 * Two migrations run on load, both idempotent:
 *   - the original localStorage blob (pre-IndexedDB) is imported and removed
 *   - rows still holding a `result` data URL are rewritten as `blob` rows
 */

import { logger } from './logger';

/** A row as it lives in IndexedDB. Object URLs are per-session, so none is stored. */
export interface StoredHistoryItem {
  id: string;
  type: string;
  blob: Blob;
  timestamp: number;
  options?: Record<string, unknown>;
  /** Optional input/before image for compare + generate-again (Wave B+). */
  sourceBlob?: Blob;
}

/** A row plus the object URL the UI renders it through. */
export interface HistoryItem extends StoredHistoryItem {
  url: string;
  sourceUrl?: string;
}

/** Shape of rows written before results were stored as Blobs. */
interface LegacyHistoryRow {
  id: string;
  type: string;
  result?: string;
  blob?: Blob;
  sourceBlob?: Blob;
  timestamp: number;
  options?: Record<string, unknown>;
}

export const MAX_HISTORY_ITEMS = 150;

const DB_NAME = 'bloomrender';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const LEGACY_STORAGE_KEY = 'bloom_generation_history';
/** Pre-Wave-T localStorage history blob (migrated via storageMigration + this reader). */
const VERY_LEGACY_STORAGE_KEY = 'pixshop_generation_history';

/** Newest first, matching how history has always been displayed. */
export function sortHistoryItems<T extends { timestamp: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
}

/** Split an already-sorted (newest first) list at the retention cap. */
export function splitOverflow<T>(items: T[], max: number): { keep: T[]; overflow: T[] } {
  return { keep: items.slice(0, max), overflow: items.slice(max) };
}

export function generateHistoryId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Decode a `data:` URL into a Blob. Synchronous (unlike fetch(dataUrl)) so
 * callers don't have to thread a promise through, and unit-testable.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || commaIndex === -1) {
    throw new Error('Not a data URL');
  }

  const header = dataUrl.slice(5, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  const isBase64 = header.endsWith(';base64');
  const mimeType = (isBase64 ? header.slice(0, -';base64'.length) : header) || 'image/png';

  if (!isBase64) {
    return new Blob([decodeURIComponent(payload)], { type: mimeType });
  }

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Normalise a row read from IndexedDB. Returns null for rows that are neither
 * a Blob row nor a decodable data-URL row, so one corrupt entry can't take the
 * whole history down with it.
 */
export function normalizeStoredRow(row: LegacyHistoryRow): {
  item: StoredHistoryItem;
  migrated: boolean;
} | null {
  const { id, type, timestamp, options } = row;
  const sourceBlob = row.sourceBlob instanceof Blob ? row.sourceBlob : undefined;

  if (row.blob instanceof Blob) {
    return { item: { id, type, timestamp, options, blob: row.blob, sourceBlob }, migrated: false };
  }

  if (typeof row.result === 'string') {
    try {
      return {
        item: {
          id,
          type,
          timestamp,
          options,
          blob: dataUrlToBlob(row.result),
          sourceBlob,
        },
        migrated: true,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/** Parses the pre-IndexedDB localStorage blob. Pure, so it can be tested without a DOM. */
export function parseLegacyHistory(raw: string | null): LegacyHistoryRow[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LegacyHistoryRow[]) : [];
  } catch {
    return [];
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;
let connection: IDBDatabase | null = null;
const OPEN_TIMEOUT_MS = 10_000;

export type HistoryStorageErrorKind = 'quota' | 'blocked' | 'unavailable';

/** Classify storage failures without replacing the original IndexedDB error. */
export function getHistoryStorageErrorKind(error: unknown): HistoryStorageErrorKind {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined;
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') return 'quota';
  if (name === 'HistoryStorageBlockedError') return 'blocked';
  return 'unavailable';
}

function invalidateConnection(db: IDBDatabase): void {
  if (connection !== db) return;
  connection = null;
  dbPromise = null;
}

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    const attempt = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      };
      const timer = setTimeout(
        () => fail(new DOMException('History database open timed out', 'TimeoutError')),
        OPEN_TIMEOUT_MS,
      );
      request.onupgradeneeded = () => {
        if (settled) {
          request.transaction?.abort();
          return;
        }
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) {
          db.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        connection = db;
        db.onversionchange = () => {
          invalidateConnection(db);
          db.close();
        };
        db.onclose = () => invalidateConnection(db);
        resolve(db);
      };
      request.onerror = () => fail(request.error ?? new Error('Failed to open history database'));
      request.onblocked = () => {
        const error = new Error('History database is blocked by another tab');
        error.name = 'HistoryStorageBlockedError';
        fail(error);
      };
    });
    dbPromise = attempt;
    void attempt.catch(() => {
      if (dbPromise === attempt) dbPromise = null;
    });
  }
  return dbPromise;
}

function withTransaction<T>(
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  return openDb().then((db) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(STORE_NAME, mode);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') throw error;
      // No request has been issued, so reopening cannot replay a dispatched write.
      invalidateConnection(db);
      db.close();
      return openDb().then((reopened) => run(reopened.transaction(STORE_NAME, mode)));
    }
    // Queue requests in the same turn as transaction creation so it stays active.
    return run(tx);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return withTransaction(
    mode,
    (tx) =>
      new Promise<T>((resolve, reject) => {
        const store = tx.objectStore(STORE_NAME);
        const request = run(store);
        // Request success can precede a commit failure or explicit transaction abort.
        tx.oncomplete = () => resolve(request.result);
        tx.onabort = () => reject(tx.error ?? new Error('History transaction aborted'));
        tx.onerror = () => reject(tx.error);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function getAllHistoryItems(): Promise<StoredHistoryItem[]> {
  const rows = await runTransaction(
    'readonly',
    (store) => store.getAll() as IDBRequest<LegacyHistoryRow[]>,
  );

  const items: StoredHistoryItem[] = [];
  const rewritten: StoredHistoryItem[] = [];

  for (const row of rows) {
    const normalized = normalizeStoredRow(row);
    if (!normalized) {
      logger.warn('Skipping unreadable history row:', row?.id);
      continue;
    }
    items.push(normalized.item);
    if (normalized.migrated) rewritten.push(normalized.item);
  }

  // Persist the data-URL -> Blob conversion so it only happens once.
  if (rewritten.length > 0) {
    try {
      await Promise.all(rewritten.map((item) => putHistoryItem(item)));
      logger.info(`Migrated ${rewritten.length} history rows from data URL to Blob`);
    } catch (err) {
      logger.error('Failed to rewrite history rows as Blobs:', err);
      // Non-fatal: the in-memory items are already Blobs, so the UI works and
      // the rewrite is retried on the next load.
    }
  }

  return sortHistoryItems(items);
}

export async function putHistoryItem(item: StoredHistoryItem): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(item));
}

export async function deleteHistoryItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await withTransaction(
    'readwrite',
    (tx) =>
      new Promise<void>((resolve, reject) => {
        const store = tx.objectStore(STORE_NAME);
        for (const id of ids) store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error ?? new Error('History transaction aborted'));
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function clearHistoryItems(): Promise<void> {
  await runTransaction('readwrite', (store) => store.clear());
}

/**
 * One-time move from the pre-IndexedDB localStorage blob. Safe to call on every
 * load: it's a no-op once the legacy key is gone.
 */
export async function migrateLegacyHistoryIfNeeded(): Promise<void> {
  // Prefer bloom_ key; fall back to pre-rename pixshop_ blob if still present.
  const raw =
    localStorage.getItem(LEGACY_STORAGE_KEY) ?? localStorage.getItem(VERY_LEGACY_STORAGE_KEY);
  if (raw === null) return;

  try {
    for (const row of parseLegacyHistory(raw)) {
      const normalized = normalizeStoredRow(row);
      if (normalized) await putHistoryItem(normalized.item);
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(VERY_LEGACY_STORAGE_KEY);
  } catch (err) {
    logger.error('Failed to migrate legacy history into IndexedDB:', err);
    // Keep the legacy key so a later retry can complete the migration.
    throw err;
  }
}
