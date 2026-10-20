/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Session-scoped estimated spend (tab lifetime), parallel to credentialStorage.
 */

const STORAGE_KEY = 'bloomrender_session_spend_usd';

export function readSessionSpendUsd(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeSessionSpendUsd(total: number): void {
  try {
    const safe = Number.isFinite(total) && total > 0 ? total : 0;
    sessionStorage.setItem(STORAGE_KEY, String(safe));
  } catch {
    // private mode / quota — ignore
  }
}

export function addSessionSpendUsd(delta: number): number {
  if (!Number.isFinite(delta) || delta <= 0) return readSessionSpendUsd();
  const next = readSessionSpendUsd() + delta;
  writeSessionSpendUsd(next);
  return next;
}

export function resetSessionSpendUsd(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Browser event so Settings / badges can refresh without prop drilling. */
export const SESSION_SPEND_EVENT = 'bloomrender:session-spend';

export function notifySessionSpendChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_SPEND_EVENT));
}

export function recordSessionSpendUsd(delta: number): number {
  const next = addSessionSpendUsd(delta);
  notifySessionSpendChanged();
  return next;
}
