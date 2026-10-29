/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (() => void) | null;
interface RequestStub {
  result: unknown;
  error: DOMException | null;
  onerror: Handler;
}
interface TransactionStub {
  error: DOMException | null;
  oncomplete: Handler;
  onerror: Handler;
  onabort: Handler;
  objectStore: () => Record<string, () => RequestStub>;
}

let request: RequestStub;
let transaction: TransactionStub;
let historyDb: typeof import('./historyDb');

beforeEach(async () => {
  vi.resetModules();
  request = { result: 'saved-id', error: null, onerror: null };
  transaction = {
    error: null,
    oncomplete: null,
    onerror: null,
    onabort: null,
    objectStore: () => ({ put: () => request, clear: () => request, delete: () => request }),
  };
  const opening = {
    result: { transaction: () => transaction },
    onsuccess: null as Handler,
  };
  vi.stubGlobal('indexedDB', {
    open: () => {
      queueMicrotask(() => opening.onsuccess?.());
      return opening;
    },
  });
  historyDb = await import('./historyDb');
});

afterEach(() => vi.unstubAllGlobals());

function write(operation: 'put' | 'clear' | 'delete'): Promise<void> {
  if (operation === 'clear') return historyDb.clearHistoryItems();
  if (operation === 'delete') return historyDb.deleteHistoryItems(['saved-id']);
  return historyDb.putHistoryItem({
    id: 'saved-id',
    type: 'portrait',
    timestamp: 1,
    blob: new Blob(['image']),
  });
}

describe('history transaction completion', () => {
  it.each(['put', 'clear', 'delete'] as const)(
    'does not resolve %s until the transaction commits',
    async (operation) => {
      let resolved = false;
      const promise = write(operation).then(() => {
        resolved = true;
      });
      await vi.waitFor(() => expect(transaction.oncomplete).toBeTypeOf('function'));
      // Individual request completion is insufficient to promise persistence.
      (request as RequestStub & { onsuccess?: () => void }).onsuccess?.();
      await Promise.resolve();
      expect(resolved).toBe(false);
      transaction.oncomplete?.();
      await promise;
      expect(resolved).toBe(true);
    },
  );

  it.each(['put', 'clear', 'delete'] as const)(
    'rejects %s when a successful request is followed by a transaction abort',
    async (operation) => {
      const promise = write(operation);
      const rejected = expect(promise).rejects.toThrow('Commit failed');
      await vi.waitFor(() => expect(transaction.onabort).toBeTypeOf('function'));
      (request as RequestStub & { onsuccess?: () => void }).onsuccess?.();
      transaction.error = new DOMException('Commit failed', 'QuotaExceededError');
      transaction.onabort?.();
      await rejected;
    },
  );

  it('rejects an explicit abort without an IndexedDB error', async () => {
    const promise = write('put');
    const rejected = expect(promise).rejects.toThrow('History transaction aborted');
    await vi.waitFor(() => expect(transaction.onabort).toBeTypeOf('function'));
    transaction.onabort?.();
    await rejected;
  });

  it('propagates a request failure', async () => {
    const promise = write('put');
    const rejected = expect(promise).rejects.toThrow('Write failed');
    await vi.waitFor(() => expect(request.onerror).toBeTypeOf('function'));
    request.error = new DOMException('Write failed', 'DataCloneError');
    request.onerror?.();
    await rejected;
  });
});
