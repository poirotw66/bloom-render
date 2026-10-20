// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mock-provider coverage for useTryOn: success path + real failure message.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useTryOn } from './useTryOn';

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

const generateVirtualTryOn = vi.fn();

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    generateVirtualTryOn: (...args: unknown[]) => generateVirtualTryOn(...args),
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

function samplePhoto(name: string): File {
  return new File(['fake-bytes'], name, { type: 'image/png' });
}

beforeEach(() => {
  generateVirtualTryOn.mockReset();
  addToHistory.mockClear();
});

describe('useTryOn handleGenerate', () => {
  it('stores a successful result and writes history', async () => {
    generateVirtualTryOn.mockResolvedValue('data:image/png;base64,tryon');
    const { result } = renderHook(() => useTryOn(), { wrapper });

    act(() => {
      result.current.setPerson(samplePhoto('person.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    await waitFor(() => {
      expect(result.current.result).toBe('data:image/png;base64,tryon');
    });
    expect(generateVirtualTryOn).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledWith(
      'tryon',
      'data:image/png;base64,tryon',
      expect.objectContaining({ background: expect.any(String), style: expect.any(String) }),
      expect.any(File),
    );
  });

  it('surfaces the first rejection reason when the whole batch fails', async () => {
    generateVirtualTryOn.mockRejectedValue(new Error('error.api_key_missing'));
    const { result } = renderHook(() => useTryOn(), { wrapper });

    act(() => {
      result.current.setPerson(samplePhoto('person.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
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
