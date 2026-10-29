// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Mock-provider coverage for useIdPhoto: successful generate + history write,
 * and surfacing a real API-key failure instead of a generic batch message.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useIdPhoto } from './useIdPhoto';
import { cropIdPhotoToSize } from '../../utils/idPhotoCrop';

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

const generateIdPhoto = vi.fn();

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    generateIdPhoto: (...args: unknown[]) => generateIdPhoto(...args),
  };
});

vi.mock('../../utils/idPhotoCrop', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/idPhotoCrop')>();
  return {
    ...actual,
    cropIdPhotoToSize: vi.fn(async (url: string) => url),
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
  return new File(['fake-bytes'], 'id.png', { type: 'image/png' });
}

beforeEach(() => {
  generateIdPhoto.mockReset();
  vi.mocked(cropIdPhotoToSize)
    .mockReset()
    .mockImplementation(async (url) => url);
  addToHistory.mockClear();
});

describe('useIdPhoto handleIdPhotoGenerate', () => {
  it('stores a successful result and writes history for the cropped output', async () => {
    generateIdPhoto.mockResolvedValue('data:image/png;base64,idphoto');
    const { result } = renderHook(() => useIdPhoto(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handleIdPhotoGenerate();
    });

    await waitFor(() => {
      expect(result.current.idPhotoResult).toBe('data:image/png;base64,idphoto');
    });
    expect(generateIdPhoto).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledWith(
      'idphoto',
      'data:image/png;base64,idphoto',
      expect.objectContaining({ retouchLevel: expect.any(String), idType: expect.any(String) }),
      expect.any(File),
    );
  });

  it('surfaces the first rejection reason when the whole batch fails', async () => {
    generateIdPhoto.mockRejectedValue(new Error('error.api_key_missing'));
    const { result } = renderHook(() => useIdPhoto(), { wrapper });

    act(() => {
      result.current.handleDrop({
        preventDefault: () => undefined,
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent);
    });

    await act(async () => {
      await result.current.handleIdPhotoGenerate();
    });

    await waitFor(() => {
      expect(result.current.idPhotoError).toBe('API key not found. Please check your settings.');
    });
    expect(result.current.idPhotoError).not.toBe('All generations failed. Please try again.');
  });
  it('does not persist a crop that finishes after cancellation', async () => {
    let finishCrop!: (url: string) => void;
    generateIdPhoto.mockResolvedValue('provider-image');
    vi.mocked(cropIdPhotoToSize).mockImplementation(
      () => new Promise((resolve) => (finishCrop = resolve)),
    );
    const { result } = renderHook(() => useIdPhoto(), { wrapper });
    act(() =>
      result.current.handleDrop({
        preventDefault() {},
        dataTransfer: { files: [samplePhoto()] },
      } as unknown as React.DragEvent),
    );
    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.handleIdPhotoGenerate();
      await Promise.resolve();
    });
    expect(cropIdPhotoToSize).toHaveBeenCalledOnce();
    act(() => result.current.cancelGeneration());
    await act(async () => {
      finishCrop('late-crop');
      await pending;
    });
    expect(addToHistory).not.toHaveBeenCalled();
    expect(result.current.idPhotoResult).toBeNull();
    expect(result.current.idPhotoLoading).toBe(false);
  });
});
