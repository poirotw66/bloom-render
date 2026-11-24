import { parseTryOnRecipe, type HistoryReference, type TryOnRecipe } from '../types/tryOnRecipe';

export interface TryOnDraft {
  person: { blob: Blob; name: string } | null;
  references: HistoryReference[];
  recipe: TryOnRecipe;
}

const DB_NAME = 'bloomrender-tryon-draft';
const STORE = 'draft';
let writes: Promise<unknown> = Promise.resolve();

async function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Draft storage is blocked'));
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Draft transaction aborted'));
    });
  } finally {
    db.close();
  }
}

export async function loadTryOnDraft(): Promise<TryOnDraft | null> {
  await writes.catch(() => undefined);
  const value = await transact<unknown>('readonly', (store) => store.get('current'));
  if (!value || typeof value !== 'object') return null;
  const draft = value as TryOnDraft;
  const recipe = parseTryOnRecipe(draft.recipe);
  if (!recipe || !Array.isArray(draft.references) || draft.references.length > 9) return null;
  if (
    draft.person &&
    (!(draft.person.blob instanceof Blob) || typeof draft.person.name !== 'string')
  )
    return null;
  if (
    draft.references.some(
      (ref) =>
        !ref ||
        !(ref.blob instanceof Blob) ||
        typeof ref.name !== 'string' ||
        !['clothing', 'pose', 'expression', 'scene', 'lighting'].includes(ref.role),
    )
  )
    return null;
  return { person: draft.person, references: draft.references, recipe };
}

export function saveTryOnDraft(draft: TryOnDraft): Promise<void> {
  const next = writes
    .catch(() => undefined)
    .then(async () => {
      await transact('readwrite', (store) => store.put(draft, 'current'));
    });
  writes = next;
  return next;
}

export function deleteTryOnDraft(): Promise<void> {
  const next = writes
    .catch(() => undefined)
    .then(async () => {
      await transact('readwrite', (store) => store.delete('current'));
    });
  writes = next;
  return next;
}
