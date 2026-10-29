// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Partial text-to-image batches keep paid results and retry only missing slots.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { runImageGeneration } from '../services/gemini/runImageGeneration';
import StartScreen from './StartScreen';

const addToHistory = vi.fn().mockResolvedValue('history-id');
vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({ addToHistory }),
}));
vi.mock('../hooks/useHistoryReplay', () => ({
  useHistoryReplay: () => undefined,
  fileFromSourceUrl: vi.fn(),
}));
vi.mock('../services/gemini/runImageGeneration', () => ({ runImageGeneration: vi.fn() }));
vi.mock('./ViralTemplatesSection', () => ({ default: () => null }));
vi.mock('./ExampleShowcase', () => ({ default: () => null }));
vi.mock('./ResultActions', () => ({ default: () => null }));

const imageUrl = (index: number) => `data:image/png;base64,${btoa(`image-${index}`)}`;

function renderGenerate(quantity = 4) {
  const onImageSelected = vi.fn();
  const settingsRef: { current: ReturnType<typeof useSettings> | null } = { current: null };
  function SettingsProbe() {
    const settings = useSettings();
    useEffect(() => {
      settingsRef.current = settings;
    }, [settings]);
    return null;
  }
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/generate',
            state: { galleryPreset: { prompt: 'A red balloon', quantity, aspectRatio: '3:4' } },
          },
        ]}
      >
        <ThemeProvider>
          <SettingsProvider>
            <SettingsProbe />
            <LanguageProvider>{children}</LanguageProvider>
          </SettingsProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }
  render(<StartScreen tab="generate" onImageSelected={onImageSelected} navigate={vi.fn()} />, {
    wrapper: Wrapper,
  });
  return {
    onImageSelected,
    switchProvider: () => settingsRef.current?.setImageProvider('openrouter'),
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('bloom_language', 'en');
  vi.mocked(runImageGeneration).mockReset();
  addToHistory.mockClear();
});

describe('StartScreen text-to-image batches', () => {
  it('keeps three successes and their history, then retries only the failed slot in original order', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce(imageUrl(2))
      .mockResolvedValueOnce(imageUrl(3))
      .mockResolvedValueOnce(imageUrl(1));
    const { onImageSelected, switchProvider } = renderGenerate();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await screen.findByText('Generated 3 of 4 images');
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('src'))).toEqual([
      imageUrl(0),
      imageUrl(2),
      imageUrl(3),
    ]);
    expect(addToHistory).toHaveBeenCalledTimes(3);
    expect(addToHistory.mock.calls.map((call) => call[2].variationIndex)).toEqual([0, 2, 3]);
    expect(onImageSelected).not.toHaveBeenCalled();

    act(() => switchProvider());
    fireEvent.click(screen.getByRole('button', { name: 'Retry 1 failed' }));
    await waitFor(() => expect(screen.queryByText('Generated 3 of 4 images')).toBeNull());
    expect(runImageGeneration).toHaveBeenCalledTimes(5);
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('src'))).toEqual([
      imageUrl(0),
      imageUrl(1),
      imageUrl(2),
      imageUrl(3),
    ]);
    expect(addToHistory).toHaveBeenCalledTimes(4);
    expect(addToHistory.mock.calls[3][2]).toEqual(
      expect.objectContaining({
        variationIndex: 1,
        prompt: 'A red balloon',
        aspectRatio: '3:4',
        numberOfImages: 4,
      }),
    );
    const calls = vi.mocked(runImageGeneration).mock.calls;
    expect(calls[4][0]).toEqual(
      expect.objectContaining({
        prompt: calls[0][0].prompt,
        aspectRatio: calls[0][0].aspectRatio,
        settings: expect.objectContaining({
          provider: calls[0][0].settings?.provider,
          model: calls[0][0].settings?.model,
        }),
      }),
    );
  });

  it('keeps a lone success in the partial-results view rather than opening the editor', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValue(new Error('error.quota_exceeded'));
    const { onImageSelected } = renderGenerate();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await screen.findByText('Generated 1 of 4 images');
    expect(screen.getByRole('button', { name: 'Retry 3 failed' })).toBeTruthy();
    expect(addToHistory).toHaveBeenCalledTimes(1);
    expect(onImageSelected).not.toHaveBeenCalled();
  });

  it('shows the real failure cause when every slot fails and does not save failed results', async () => {
    vi.mocked(runImageGeneration).mockRejectedValue(new Error('error.api_key_missing'));
    renderGenerate();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await screen.findByText('API key not found. Please check your settings.');
    expect(addToHistory).not.toHaveBeenCalled();
  });

  it('keeps existing images and history when a retry fails again', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValue(new Error('error.quota_exceeded'));
    renderGenerate(2);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await screen.findByText('Generated 1 of 2 images');

    fireEvent.click(screen.getByRole('button', { name: 'Retry 1 failed' }));
    await waitFor(() => {
      expect(runImageGeneration).toHaveBeenCalledTimes(3);
      expect(screen.getByRole('button', { name: 'Retry 1 failed' }).hasAttribute('disabled')).toBe(
        false,
      );
    });
    expect(screen.getByText('Generated 1 of 2 images')).toBeTruthy();
    expect(screen.getByRole('img').getAttribute('src')).toBe(imageUrl(0));
    expect(addToHistory).toHaveBeenCalledTimes(1);
  });

  it('prevents reset and editor navigation while a failed slot is being retried', async () => {
    let finishRetry!: (url: string) => void;
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockImplementationOnce(() => new Promise((resolve) => (finishRetry = resolve)));
    renderGenerate(2);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await screen.findByText('Generated 1 of 2 images');

    fireEvent.click(screen.getByRole('button', { name: 'Retry 1 failed' }));
    expect(
      screen.getByRole('button', { name: 'Generate New Images' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.getByRole('button', { name: /Edit this.*1/i }).hasAttribute('disabled')).toBe(
      true,
    );
    await act(async () => finishRetry(imageUrl(1)));
    expect(
      screen.getByRole('button', { name: 'Generate New Images' }).hasAttribute('disabled'),
    ).toBe(false);
  });

  it('preserves model comparison and retries only its failed model', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce(imageUrl(1));
    renderGenerate();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate & Compare' }));
    await screen.findByText('Generated 1 of 2 images');
    const calls = vi.mocked(runImageGeneration).mock.calls;
    expect(calls[0][0].settings?.model).not.toBe(calls[1][0].settings?.model);

    fireEvent.click(screen.getByRole('button', { name: 'Retry 1 failed' }));
    await waitFor(() => expect(screen.queryByText('Generated 1 of 2 images')).toBeNull());
    expect(runImageGeneration).toHaveBeenCalledTimes(3);
    expect(calls[2][0].settings?.model).toBe(calls[1][0].settings?.model);
    expect(addToHistory).toHaveBeenCalledTimes(2);
  });

  it('still sends a successful single-image run directly to the editor', async () => {
    vi.mocked(runImageGeneration).mockResolvedValueOnce(imageUrl(0));
    const { onImageSelected } = renderGenerate(1);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await waitFor(() => expect(onImageSelected).toHaveBeenCalledWith(expect.any(File)));
    expect(runImageGeneration).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledTimes(1);
  });
});
