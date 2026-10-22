/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Session-scoped pending remix (survives one navigation; cleared on consume).
 */

import type { RemixPayload } from './remixLink';
import { decodeRemixPayload, encodeRemixPayload } from './remixLink';

export const STORAGE_KEY_PENDING_REMIX = 'pixshop_pending_remix';

export function setPendingRemix(payload: RemixPayload): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_PENDING_REMIX, encodeRemixPayload(payload));
  } catch {
    /* private mode */
  }
}

export function peekPendingRemix(): RemixPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PENDING_REMIX);
    return raw ? decodeRemixPayload(raw) : null;
  } catch {
    return null;
  }
}

export function consumePendingRemix(): RemixPayload | null {
  const payload = peekPendingRemix();
  try {
    sessionStorage.removeItem(STORAGE_KEY_PENDING_REMIX);
  } catch {
    /* ignore */
  }
  return payload;
}

export function clearPendingRemix(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_PENDING_REMIX);
  } catch {
    /* ignore */
  }
}
