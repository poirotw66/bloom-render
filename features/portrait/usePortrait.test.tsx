// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mock-provider coverage for usePortrait: success path + real failure message.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
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
});
