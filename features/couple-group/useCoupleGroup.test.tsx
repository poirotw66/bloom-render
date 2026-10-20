// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mock-provider coverage for useCoupleGroup via runImageGeneration.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useCoupleGroup } from './useCoupleGroup';

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

const runImageGeneration = vi.fn();

vi.mock('../../services/gemini/runImageGeneration', () => ({
  runImageGeneration: (...args: unknown[]) => runImageGeneration(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <SettingsProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

function samplePhoto(name: string): File {
  return new File(['fake-bytes'], name, { type: 'image/png' });
}

beforeEach(() => {
  runImageGeneration.mockReset();
  addToHistory.mockClear();
});

describe('useCoupleGroup handleGenerate', () => {
  it('stores a successful couple result and writes history', async () => {
    runImageGeneration.mockResolvedValue('data:image/png;base64,couple');
    const { result } = renderHook(() => useCoupleGroup(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto('a.png'), samplePhoto('b.png')] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    await waitFor(() => {
      expect(result.current.result).toBe('data:image/png;base64,couple');
    });
    expect(runImageGeneration).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledWith(
      'couple',
      'data:image/png;base64,couple',
      expect.objectContaining({ style: expect.any(String) }),
      expect.any(File),
    );
  });

  it('surfaces the first rejection reason when the whole batch fails', async () => {
    runImageGeneration.mockRejectedValue(new Error('error.api_key_missing'));
    const { result } = renderHook(() => useCoupleGroup(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto('a.png'), samplePhoto('b.png')] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('API key not found. Please check your settings.');
    });
    expect(result.current.error).not.toBe('All generations failed. Please try again.');
  });
});
