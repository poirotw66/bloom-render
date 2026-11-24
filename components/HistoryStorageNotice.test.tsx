// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import type { HistoryStorageStatus } from '../hooks/useHistory';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { downloadBatchWithZipFallback } from '../utils/downloadHelpers';
import HistoryStorageNotice from './HistoryStorageNotice';

let status: HistoryStorageStatus;
const retry = vi.fn(async () => undefined);
const pending = [
  {
    id: 'pending',
    type: 'portrait',
    timestamp: 1,
    blob: new Blob(['image'], { type: 'image/jpeg' }),
  },
];
vi.mock('../hooks/useHistory', () => ({
  useHistoryStorageStatus: () => ({ ...status, retryHistoryStorage: retry }),
  getPendingHistoryItems: () => pending,
}));
vi.mock('../hooks/useUnsavedWork', () => ({ confirmDiscardUnsavedWork: vi.fn(() => true) }));
vi.mock('../utils/downloadHelpers', () => ({
  downloadBatchWithZipFallback: vi.fn(async () => undefined),
}));

function mount(onManage?: () => void) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <HistoryStorageNotice onManage={onManage} />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.setItem('bloom_language', 'en');
  status = { issue: null, pendingCount: 0, isRetrying: false };
  retry.mockClear();
  vi.mocked(downloadBatchWithZipFallback).mockReset().mockResolvedValue(undefined);
  vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(true);
});

describe('history storage notice', () => {
  it('stays absent while storage is healthy', () => {
    mount();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('distinguishes quota failure and downloads pending blobs without removing them', async () => {
    status = { issue: { operation: 'save', kind: 'quota' }, pendingCount: 1, isRetrying: false };
    mount();
    expect(screen.getByText(/Browser storage is full/)).toBeTruthy();
    expect(screen.getByText(/kept only in this tab/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Download 1 unsaved images' }));
    await waitFor(() => expect(downloadBatchWithZipFallback).toHaveBeenCalledOnce());
    const args = vi.mocked(downloadBatchWithZipFallback).mock.calls[0][0];
    expect(args.sources).toEqual([pending[0].blob]);
    expect(args.itemFileName(0)).toBe('unsaved-image-1.jpg');
    expect(pending).toHaveLength(1);
  });

  it('retries storage and disables repeat actions during recovery', async () => {
    status = { issue: { operation: 'load', kind: 'blocked' }, pendingCount: 0, isRetrying: false };
    const view = mount();
    expect(screen.getByText(/Close other BloomRender tabs/)).toBeTruthy();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Reconnect and retry saves' })),
    );
    expect(retry).toHaveBeenCalledOnce();
    status = { ...status, isRetrying: true };
    view.rerender(
      <MemoryRouter>
        <LanguageProvider>
          <HistoryStorageNotice />
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Retrying storage…' }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('does not imply failed deletions will be repeated automatically', () => {
    status = {
      issue: { operation: 'delete', kind: 'unavailable' },
      pendingCount: 0,
      isRetrying: false,
    };
    mount();
    expect(screen.getByText(/Reconnect, then try deleting it again/)).toBeTruthy();
  });

  it('respects unsaved work before opening history and closing its modal', () => {
    status = {
      issue: { operation: 'load', kind: 'unavailable' },
      pendingCount: 0,
      isRetrying: false,
    };
    const onManage = vi.fn();
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(false);
    mount(onManage);
    fireEvent.click(screen.getByRole('link', { name: 'Manage history' }));
    expect(onManage).not.toHaveBeenCalled();
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(true);
    fireEvent.click(screen.getByRole('link', { name: 'Manage history' }));
    expect(onManage).toHaveBeenCalledOnce();
  });
});
