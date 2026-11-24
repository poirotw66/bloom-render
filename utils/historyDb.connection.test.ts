/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (() => void) | null;
interface TransactionStub {
  oncomplete: Handler;
  onabort: Handler;
  onerror: Handler;
  error: DOMException | null;
  objectStore: ReturnType<typeof vi.fn>;
}
interface ConnectionStub {
  onclose: Handler;
  onversionchange: Handler;
  close: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  createObjectStore: ReturnType<typeof vi.fn>;
  objectStoreNames: { contains: ReturnType<typeof vi.fn> };
  transactions: TransactionStub[];
}
interface OpenRequestStub {
  result: ConnectionStub;
  error: DOMException | null;
  onsuccess: Handler;
  onerror: Handler;
  onblocked: Handler;
  onupgradeneeded: Handler;
  transaction: { abort: ReturnType<typeof vi.fn> };
}

let historyDb: typeof import('./historyDb');
let requests: OpenRequestStub[];
let open: ReturnType<typeof vi.fn>;

function connection(): ConnectionStub {
  const transactions: TransactionStub[] = [];
  return {
    onclose: null,
    onversionchange: null,
    close: vi.fn(),
    transaction: vi.fn(() => {
      const request = { result: [], error: null, onerror: null };
      const store = { getAll: vi.fn(() => request), put: vi.fn(() => request) };
      const tx: TransactionStub = {
        oncomplete: null,
        onabort: null,
        onerror: null,
        error: null,
        objectStore: vi.fn(() => store),
      };
      transactions.push(tx);
      return tx;
    }),
    createObjectStore: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => true) },
    transactions,
  };
}

async function completeTransactions(db: ConnectionStub, count = 1): Promise<void> {
  await vi.waitFor(() => {
    expect(db.transactions).toHaveLength(count);
    for (const tx of db.transactions) expect(tx.oncomplete).toBeTypeOf('function');
  });
  for (const tx of db.transactions) tx.oncomplete?.();
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  requests = [];
  open = vi.fn(() => {
    const request: OpenRequestStub = {
      result: connection(),
      error: null,
      onsuccess: null,
      onerror: null,
      onblocked: null,
      onupgradeneeded: null,
      transaction: { abort: vi.fn() },
    };
    requests.push(request);
    return request;
  });
  vi.stubGlobal('indexedDB', { open });
  historyDb = await import('./historyDb');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('history database connections', () => {
  it('retries a failed initial open without reloading the module', async () => {
    const first = historyDb.getAllHistoryItems();
    const error = new DOMException('Temporary storage failure', 'UnknownError');
    const rejected = expect(first).rejects.toBe(error);
    requests[0].error = error;
    requests[0].onerror?.();
    await rejected;

    const second = historyDb.getAllHistoryItems();
    expect(open).toHaveBeenCalledTimes(2);
    requests[1].onsuccess?.();
    await completeTransactions(requests[1].result);
    await expect(second).resolves.toEqual([]);
  });

  it('retries a synchronous open exception and shares concurrent open attempts', async () => {
    open.mockImplementationOnce(() => {
      throw new DOMException('Storage temporarily disabled', 'SecurityError');
    });
    await expect(historyDb.getAllHistoryItems()).rejects.toMatchObject({ name: 'SecurityError' });
    const first = historyDb.getAllHistoryItems();
    const second = historyDb.getAllHistoryItems();
    expect(open).toHaveBeenCalledTimes(2);
    requests[0].onsuccess?.();
    await completeTransactions(requests[0].result, 2);
    await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
  });

  it('rejects a blocked open promptly and closes its late connection without replacing a retry', async () => {
    const first = historyDb.getAllHistoryItems();
    const rejected = expect(first).rejects.toMatchObject({ name: 'HistoryStorageBlockedError' });
    requests[0].onblocked?.();
    await rejected;
    expect(vi.getTimerCount()).toBe(0);

    const retry = historyDb.getAllHistoryItems();
    requests[1].onsuccess?.();
    await completeTransactions(requests[1].result);
    await retry;
    requests[0].onsuccess?.();
    expect(requests[0].result.close).toHaveBeenCalledOnce();

    const next = historyDb.getAllHistoryItems();
    expect(open).toHaveBeenCalledTimes(2);
    await completeTransactions(requests[1].result, 2);
    await next;
  });

  it('aborts a late upgrade after a blocked open was rejected', async () => {
    const pending = historyDb.getAllHistoryItems();
    const rejected = expect(pending).rejects.toMatchObject({ name: 'HistoryStorageBlockedError' });
    requests[0].onblocked?.();
    await rejected;
    requests[0].onupgradeneeded?.();
    expect(requests[0].transaction.abort).toHaveBeenCalledOnce();
    expect(requests[0].result.createObjectStore).not.toHaveBeenCalled();
  });

  it('bounds an open that never emits a success or error and permits a retry', async () => {
    const pending = historyDb.getAllHistoryItems();
    const rejected = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejected;
    const retry = historyDb.getAllHistoryItems();
    requests[1].onsuccess?.();
    await completeTransactions(requests[1].result);
    await expect(retry).resolves.toEqual([]);
    requests[0].onsuccess?.();
    expect(requests[0].result.close).toHaveBeenCalledOnce();
  });

  it('creates the history store on a normal first upgrade', async () => {
    const pending = historyDb.getAllHistoryItems();
    const db = requests[0].result;
    db.objectStoreNames.contains.mockReturnValue(false);
    requests[0].onupgradeneeded?.();
    expect(db.createObjectStore).toHaveBeenCalledWith('history', { keyPath: 'id' });
    requests[0].onsuccess?.();
    await completeTransactions(db);
    await pending;
  });

  it('queues the first request before the transaction creation turn ends', async () => {
    const pending = historyDb.putHistoryItem({
      id: 'new',
      timestamp: 1,
      type: 'portrait',
      blob: new Blob(['image']),
    });
    const db = requests[0].result;
    const create = db.transaction.getMockImplementation() as () => TransactionStub;
    db.transaction.mockImplementation(() => {
      const tx = create() as TransactionStub;
      const objectStore = tx.objectStore.getMockImplementation() as () => unknown;
      let active = true;
      queueMicrotask(() => {
        active = false;
      });
      tx.objectStore.mockImplementation(() => {
        if (!active) throw new DOMException('Transaction inactive', 'TransactionInactiveError');
        return objectStore();
      });
      return tx;
    });
    requests[0].onsuccess?.();
    await completeTransactions(db);
    await expect(pending).resolves.toBeUndefined();
  });

  it.each(['onclose', 'onversionchange'] as const)(
    'invalidates the connection on %s and opens a fresh one',
    async (event) => {
      const first = historyDb.getAllHistoryItems();
      requests[0].onsuccess?.();
      await completeTransactions(requests[0].result);
      await first;
      requests[0].result[event]?.();
      if (event === 'onversionchange') expect(requests[0].result.close).toHaveBeenCalledOnce();

      const second = historyDb.getAllHistoryItems();
      expect(open).toHaveBeenCalledTimes(2);
      requests[1].onsuccess?.();
      await completeTransactions(requests[1].result);
      await second;
      // A late close notification from the old connection cannot invalidate the new one.
      requests[0].result.onclose?.();
      const third = historyDb.getAllHistoryItems();
      expect(open).toHaveBeenCalledTimes(2);
      await completeTransactions(requests[1].result, 2);
      await third;
    },
  );

  it('reopens a silently closed connection before issuing a request, without duplicating writes', async () => {
    const first = historyDb.getAllHistoryItems();
    requests[0].onsuccess?.();
    await completeTransactions(requests[0].result);
    await first;
    requests[0].result.transaction.mockImplementation(() => {
      throw new DOMException('Connection closed', 'InvalidStateError');
    });

    const writing = historyDb.putHistoryItem({
      id: 'new',
      timestamp: 1,
      type: 'portrait',
      blob: new Blob(['image']),
    });
    await vi.waitFor(() => expect(open).toHaveBeenCalledTimes(2));
    requests[1].onsuccess?.();
    await completeTransactions(requests[1].result);
    await writing;
    expect(requests[0].result.close).toHaveBeenCalledOnce();
    expect(requests[1].result.transaction).toHaveBeenCalledOnce();
    const store = requests[1].result.transactions[0].objectStore.mock.results[0].value;
    expect(store.put).toHaveBeenCalledOnce();
  });

  it('retains legacy history after a failed migration and completes an explicit later retry', async () => {
    const raw = JSON.stringify([
      { id: 'legacy', type: 'portrait', timestamp: 1, result: 'data:image/png;base64,eA==' },
    ]);
    const storage = new Map([['bloom_generation_history', raw]]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
    });
    const error = new DOMException('Storage full', 'QuotaExceededError');
    const first = historyDb.migrateLegacyHistoryIfNeeded();
    const rejected = expect(first).rejects.toBe(error);
    requests[0].onsuccess?.();
    await vi.waitFor(() =>
      expect(requests[0].result.transactions[0]?.onabort).toBeTypeOf('function'),
    );
    const firstTx = requests[0].result.transactions[0];
    firstTx.error = error;
    firstTx.onabort?.();
    await rejected;
    expect(storage.get('bloom_generation_history')).toBe(raw);

    const retry = historyDb.migrateLegacyHistoryIfNeeded();
    await vi.waitFor(() =>
      expect(requests[0].result.transactions[1]?.oncomplete).toBeTypeOf('function'),
    );
    requests[0].result.transactions[1].oncomplete?.();
    await retry;
    expect(storage.has('bloom_generation_history')).toBe(false);
    expect(open).toHaveBeenCalledOnce();
  });

  it.each(['UnknownError', 'QuotaExceededError'])(
    'does not reopen or replay an already-issued write after a %s transaction abort',
    async (name) => {
      const writing = historyDb.putHistoryItem({
        id: 'new',
        timestamp: 1,
        type: 'portrait',
        blob: new Blob(['image']),
      });
      const error = new DOMException('Commit failed', name);
      const rejected = expect(writing).rejects.toBe(error);
      requests[0].onsuccess?.();
      await vi.waitFor(() =>
        expect(requests[0].result.transactions[0]?.onabort).toBeTypeOf('function'),
      );
      const tx = requests[0].result.transactions[0];
      tx.error = error;
      tx.onabort?.();
      await rejected;
      expect(open).toHaveBeenCalledOnce();
      expect(requests[0].result.transaction).toHaveBeenCalledOnce();
    },
  );
});

describe('history storage errors', () => {
  it('classifies quota and blocked failures without relying on realm-specific instanceof', () => {
    expect(
      historyDb.getHistoryStorageErrorKind(new DOMException('Full', 'QuotaExceededError')),
    ).toBe('quota');
    expect(historyDb.getHistoryStorageErrorKind({ name: 'NS_ERROR_DOM_QUOTA_REACHED' })).toBe(
      'quota',
    );
    expect(historyDb.getHistoryStorageErrorKind({ name: 'HistoryStorageBlockedError' })).toBe(
      'blocked',
    );
    expect(historyDb.getHistoryStorageErrorKind(new Error('Offline'))).toBe('unavailable');
    expect(historyDb.getHistoryStorageErrorKind(null)).toBe('unavailable');
  });
});
