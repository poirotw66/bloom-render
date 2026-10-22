/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Tiny external store: count successful generations (including demo) so UI
 * like the GitHub star nudge can react without depending on IndexedDB history
 * (demo results are intentionally not persisted).
 */

import { useSyncExternalStore } from 'react';

let successCount = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function recordGenerationSuccess(): void {
  successCount += 1;
  notify();
}

export function getGenerationSuccessCount(): number {
  return successCount;
}

/** Test helper — reset between cases. */
export function resetGenerationSuccessCount(): void {
  successCount = 0;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGenerationSuccessCount(): number {
  return useSyncExternalStore(subscribe, getGenerationSuccessCount, getGenerationSuccessCount);
}
