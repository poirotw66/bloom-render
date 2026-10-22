/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  clearPendingRemix,
  consumePendingRemix,
  peekPendingRemix,
  setPendingRemix,
  STORAGE_KEY_PENDING_REMIX,
} from './pendingRemix';

afterEach(() => {
  clearPendingRemix();
});

describe('pendingRemix', () => {
  it('roundtrips set → peek → consume', () => {
    setPendingRemix({ v: 1, id: 'figurine-box' });
    expect(peekPendingRemix()).toEqual({ v: 1, id: 'figurine-box' });
    expect(sessionStorage.getItem(STORAGE_KEY_PENDING_REMIX)).toBeTruthy();
    expect(consumePendingRemix()).toEqual({ v: 1, id: 'figurine-box' });
    expect(peekPendingRemix()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY_PENDING_REMIX)).toBeNull();
  });

  it('rejects garbage stored under the key', () => {
    sessionStorage.setItem(STORAGE_KEY_PENDING_REMIX, 'not-valid');
    expect(peekPendingRemix()).toBeNull();
  });
});
