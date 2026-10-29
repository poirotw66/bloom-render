// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mock-provider coverage for usePortrait: success path + real failure message.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { usePortrait } from './usePortrait';

const addToHistory = vi.fn().mockResolvedValue('history-id');

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({
    history: [],
    addToHistory,
    removeFromHistory: vi.fn(),
    clearHistory: vi.fn(),
    getHistoryByType: vi.fn(() => []),
  }),
}));

const generateProfessionalPortrait = vi.fn();

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    generateProfessionalPortrait: (...args: unknown[]) => generateProfessionalPortrait(...args),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <SettingsProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

function samplePhoto(): File {
  return new File(['fake-bytes'], 'portrait.png', { type: 'image/png' });
}

beforeEach(() => {
  generateProfessionalPortrait.mockReset();
  addToHistory.mockClear();
});

afterEach(() => vi.useRealTimers());

describe('usePortrait handlePortraitGenerate', () => {
  it('stores a successful result and writes history', async () => {
    generateProfessionalPortrait.mockResolvedValue('data:image/png;base64,portrait');
    const { result } = renderHook(() => usePortrait(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handlePortraitGenerate();
    });

    await waitFor(() => {
      expect(result.current.portraitResult).toBe('data:image/png;base64,portrait');
    });
    expect(generateProfessionalPortrait).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledWith(
      'portrait',
      'data:image/png;base64,portrait',
      expect.objectContaining({ portraitType: expect.any(String) }),
      expect.any(File),
    );
  });

  it('surfaces the first rejection reason when the whole batch fails', async () => {
    generateProfessionalPortrait.mockRejectedValue(new Error('error.api_key_missing'));
    const { result } = renderHook(() => usePortrait(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handlePortraitGenerate();
    });

    await waitFor(() => {
      expect(result.current.portraitError).toBe('API key not found. Please check your settings.');
    });
    expect(result.current.portraitError).not.toBe('All generations failed. Please try again.');
  });
  it('cancels immediately, clears its ticker, and ignores an old result after a newer run starts', async () => {
    let finishOld!: (url: string) => void;
    let finishNew!: (url: string) => void;
    generateProfessionalPortrait
      .mockImplementationOnce(() => new Promise((resolve) => (finishOld = resolve)))
      .mockImplementationOnce(() => new Promise((resolve) => (finishNew = resolve)));
    const { result } = renderHook(() => usePortrait(), { wrapper });
    act(() =>
      result.current.handleDrop({
        preventDefault() {},
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent),
    );
    vi.useFakeTimers();
    let oldRun!: Promise<void>;
    let newRun!: Promise<void>;
    act(() => {
      oldRun = result.current.handlePortraitGenerate();
    });
    expect(vi.getTimerCount()).toBe(1);
    act(() => result.current.cancelGeneration());
    expect(result.current.portraitLoading).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => {
      newRun = result.current.handlePortraitGenerate();
      await oldRun;
      finishOld('old-image');
      await Promise.resolve();
    });
    expect(result.current.portraitLoading).toBe(true);
    expect(result.current.portraitResult).toBeNull();
    expect(addToHistory).not.toHaveBeenCalled();
    await act(async () => {
      finishNew('new-image');
      await newRun;
    });
    expect(result.current.portraitResult).toBe('new-image');
    expect(addToHistory).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops its ticker on unmount and never persists a late provider result', async () => {
    let finish!: (url: string) => void;
    generateProfessionalPortrait.mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const { result, unmount } = renderHook(() => usePortrait(), { wrapper });
    act(() =>
      result.current.handleDrop({
        preventDefault() {},
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent),
    );
    vi.useFakeTimers();
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handlePortraitGenerate();
    });
    const signal = generateProfessionalPortrait.mock.calls[0][1].settings.abortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    finish('late-image');
    await pending;
    expect(addToHistory).not.toHaveBeenCalled();
  });
});
