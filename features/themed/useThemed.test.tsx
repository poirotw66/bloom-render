// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mock-provider coverage for useThemed: success path + real failure message.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useThemed } from './useThemed';

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

const generateThemedPhoto = vi.fn();

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    generateThemedPhoto: (...args: unknown[]) => generateThemedPhoto(...args),
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
  return new File(['fake-bytes'], 'themed.png', { type: 'image/png' });
}

beforeEach(() => {
  generateThemedPhoto.mockReset();
  addToHistory.mockClear();
});

describe('useThemed handleThemedGenerate', () => {
  it('stores a successful result and writes history', async () => {
    generateThemedPhoto.mockResolvedValue('data:image/png;base64,themed');
    const { result } = renderHook(() => useThemed(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handleThemedGenerate();
    });

    await waitFor(() => {
      expect(result.current.themedResult).toBe('data:image/png;base64,themed');
    });
    expect(generateThemedPhoto).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledWith(
      'themed',
      'data:image/png;base64,themed',
      expect.objectContaining({ themeType: expect.any(String) }),
      expect.any(File),
    );
  });

  it('surfaces the first rejection reason when the whole batch fails', async () => {
    generateThemedPhoto.mockRejectedValue(new Error('error.api_key_missing'));
    const { result } = renderHook(() => useThemed(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handleThemedGenerate();
    });

    await waitFor(() => {
      expect(result.current.themedError).toBe('API key not found. Please check your settings.');
    });
    expect(result.current.themedError).not.toBe('All generations failed. Please try again.');
  });
});
