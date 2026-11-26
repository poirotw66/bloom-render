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
import { materialFile } from '../utils/materialFile';
import type { HistoryReference } from '../types/tryOnRecipe';
import type { HistoryReplayState } from '../utils/historyReplay';

const addToHistory = vi.fn().mockResolvedValue('history-id');
vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({ addToHistory }),
}));
const replay = vi.hoisted(() => ({
  apply: undefined as ((payload: HistoryReplayState['bloomHistoryReplay']) => void) | undefined,
}));
vi.mock('../hooks/useHistoryReplay', () => ({
  useHistoryReplay: (apply: typeof replay.apply) => {
    replay.apply = apply;
  },
  fileFromSourceUrl: vi.fn(),
}));
vi.mock('../services/gemini/runImageGeneration', () => ({ runImageGeneration: vi.fn() }));
vi.mock('./ViralTemplatesSection', () => ({ default: () => null }));
vi.mock('./ExampleShowcase', () => ({ default: () => null }));
vi.mock('./ResultActions', () => ({ default: () => null }));
vi.mock('../utils/materialFile', () => ({ materialFile: vi.fn() }));
vi.mock('../utils/imageValidation', () => ({
  validateImageUploadMessage: vi.fn().mockResolvedValue(null),
}));

const imageUrl = (index: number) => `data:image/png;base64,${btoa(`image-${index}`)}`;

async function renderGenerate(quantity = 4, materialIds?: string[]) {
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
            state: {
              galleryPreset: { prompt: 'A red balloon', quantity, aspectRatio: '3:4' },
              ...(materialIds ? { materialBasket: { v: 1, materialIds } } : {}),
            },
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
  const view = render(
    <StartScreen tab="generate" onImageSelected={onImageSelected} navigate={vi.fn()} />,
    {
      wrapper: Wrapper,
    },
  );
  await screen.findByRole('button', { name: 'Generate Image' }, { timeout: 5000 });
  return {
    onImageSelected,
    unmount: view.unmount,
    showUpload: () =>
      view.rerender(
        <StartScreen tab="upload" onImageSelected={onImageSelected} navigate={vi.fn()} />,
      ),
    switchProvider: (provider: 'openrouter' | 'openai' = 'openrouter') =>
      settingsRef.current?.setImageProvider(provider),
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('bloom_language', 'en');
  vi.mocked(runImageGeneration).mockReset();
  addToHistory.mockClear();
  vi.mocked(materialFile).mockReset();
  vi.mocked(materialFile).mockImplementation(
    async (material) => new File([material.id], `${material.id}.png`, { type: 'image/png' }),
  );
});

describe('StartScreen text-to-image batches', () => {
  it('preserves uploaded reference and all basket inputs in requests, history and retries', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce(imageUrl(1));
    const { switchProvider } = await renderGenerate(2, [
      'white-oxford-shirt',
      'pose-seated-profile',
    ]);
    await screen.findByRole('region', { name: 'Selected reference materials' });
    await waitFor(() => expect(screen.queryByText('Loading reference materials…')).toBeNull());
    expect(vi.mocked(runImageGeneration)).not.toHaveBeenCalled();
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const uploaded = new File(
      [Uint8Array.from(atob(png), (char) => char.charCodeAt(0))],
      'personal.png',
      { type: 'image/png' },
    );
    fireEvent.change(document.querySelector('#generate-reference-upload')!, {
      target: { files: [uploaded] },
    });
    await screen.findByRole('button', { name: 'Remove' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await screen.findByText('Generated 1 of 2 images');
    const first = vi.mocked(runImageGeneration).mock.calls[0][0];
    expect(first.images?.map((file) => file.name)).toEqual([
      'personal.png',
      'white-oxford-shirt.png',
      'pose-seated-profile.png',
    ]);
    expect(first.prompt).toContain('Image 2: clothing:');
    expect(first.prompt).toContain('Image 3: pose:');
    expect(addToHistory.mock.calls[0][3]).toBe(uploaded);
    expect(
      (addToHistory.mock.calls[0][4] as HistoryReference[]).map((ref) => ref.materialId),
    ).toEqual(['white-oxford-shirt', 'pose-seated-profile']);
    expect(addToHistory.mock.calls[0][2].resolvedPrompt).toBe(first.prompt);
    act(() => switchProvider('openai'));
    fireEvent.click(screen.getByRole('button', { name: 'Retry 1 failed' }));
    await waitFor(() => expect(addToHistory).toHaveBeenCalledTimes(2));
    const retry = vi.mocked(runImageGeneration).mock.calls[2][0];
    expect(retry.prompt).toBe(first.prompt);
    expect(retry.images).toEqual(first.images);
    expect(retry.settings?.provider).toBe(first.settings?.provider);
    expect(retry.settings?.model).toBe(first.settings?.model);
  });

  it('restores every archived input before replaying generation', async () => {
    vi.mocked(runImageGeneration).mockResolvedValue(imageUrl(0));
    await renderGenerate(2);
    const person = new File(['person'], 'private.png', { type: 'image/png' });
    const references: HistoryReference[] = [
      {
        role: 'clothing',
        materialId: 'white-oxford-shirt',
        name: 'shirt.png',
        blob: new Blob(['shirt'], { type: 'image/png' }),
      },
      {
        role: 'pose',
        materialId: 'pose-seated-profile',
        name: 'pose.png',
        blob: new Blob(['pose'], { type: 'image/png' }),
      },
    ];
    await act(async () =>
      replay.apply?.({
        type: 'generate',
        options: { prompt: 'Replay this scene', numberOfImages: 2 },
        sourceBlob: person,
        references,
      }),
    );
    await screen.findByRole('region', { name: 'Selected reference materials' });
    expect(runImageGeneration).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledTimes(2));
    const request = vi.mocked(runImageGeneration).mock.calls[0][0];
    expect(request.prompt).toContain('Replay this scene');
    expect(request.images?.map((file) => file.name)).toEqual([
      'generate-reference.png',
      'shirt.png',
      'pose.png',
    ]);
    expect(addToHistory.mock.calls[0][4]).toEqual(
      references.map((ref, index) => ({ ...ref, blob: request.images![index + 1] })),
    );
  });

  it('does not partially apply basket references when one image fails to load', async () => {
    vi.mocked(materialFile).mockImplementation(async (material) => {
      if (material.role === 'pose') throw new Error('error.network_error');
      return new File(['shirt'], 'shirt.png', { type: 'image/png' });
    });
    await renderGenerate(2, ['white-oxford-shirt', 'pose-seated-profile']);
    await screen.findByText(/network error/i);
    expect(screen.queryByRole('img', { name: 'Oxford shirt' })).toBeNull();
    expect(runImageGeneration).not.toHaveBeenCalled();
  });

  it('keeps three successes and their history, then retries only the failed slot in original order', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce(imageUrl(2))
      .mockResolvedValueOnce(imageUrl(3))
      .mockResolvedValueOnce(imageUrl(1));
    const { onImageSelected, switchProvider } = await renderGenerate();
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
    const { onImageSelected } = await renderGenerate();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await screen.findByText('Generated 1 of 4 images');
    expect(screen.getByRole('button', { name: 'Retry 3 failed' })).toBeTruthy();
    expect(addToHistory).toHaveBeenCalledTimes(1);
    expect(onImageSelected).not.toHaveBeenCalled();
  });

  it('shows the real failure cause when every slot fails and does not save failed results', async () => {
    vi.mocked(runImageGeneration).mockRejectedValue(new Error('error.api_key_missing'));
    await renderGenerate();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await screen.findByText('API key not found. Please check your settings.');
    expect(addToHistory).not.toHaveBeenCalled();
  });

  it('keeps existing images and history when a retry fails again', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValue(new Error('error.quota_exceeded'));
    await renderGenerate(2);
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
    await renderGenerate(2);
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

  it('uses the selected OpenAI provider after switching away from Gemini comparison', async () => {
    sessionStorage.setItem('bloom_openai_api_key', 'mock-openai-key');
    vi.mocked(runImageGeneration).mockResolvedValue(imageUrl(0));
    const { switchProvider } = await renderGenerate(1);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Generate & Compare' })).toBeTruthy();
    await act(async () => switchProvider('openai'));
    fireEvent.click(await screen.findByRole('button', { name: 'Generate Image' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledOnce());
    expect(vi.mocked(runImageGeneration).mock.calls[0][0].settings).toMatchObject({
      provider: 'openai',
      apiKey: 'mock-openai-key',
      model: 'gpt-image-2.6-sunburst',
    });
  });

  it('preserves model comparison and retries only its failed model', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce(imageUrl(0))
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce(imageUrl(1));
    await renderGenerate();
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
    const { onImageSelected } = await renderGenerate(1);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));

    await waitFor(() => expect(onImageSelected).toHaveBeenCalledWith(expect.any(File)));
    expect(runImageGeneration).toHaveBeenCalledTimes(1);
    expect(addToHistory).toHaveBeenCalledTimes(1);
  });
  it('ignores a cancelled model response after starting another comparison', async () => {
    const pending: Array<(url: string) => void> = [];
    vi.mocked(runImageGeneration).mockImplementation(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    await renderGenerate();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate & Compare' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await screen.findByRole('button', { name: 'Generate & Compare' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate & Compare' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledTimes(4));
    await act(async () => {
      pending[0](imageUrl(0));
      pending[1](imageUrl(1));
    });
    expect(addToHistory).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    await act(async () => {
      pending[2](imageUrl(2));
      pending[3](imageUrl(3));
    });
    await screen.findByRole('button', { name: 'Generate New Images' });
    expect(addToHistory).toHaveBeenCalledTimes(2);
  });

  it('does not save a normal generation or open the editor after unmount', async () => {
    let finish!: (url: string) => void;
    vi.mocked(runImageGeneration).mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const { onImageSelected, unmount } = await renderGenerate(1);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledOnce());
    const signal = vi.mocked(runImageGeneration).mock.calls[0][0].settings?.abortSignal;
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => finish(imageUrl(0)));
    expect(addToHistory).not.toHaveBeenCalled();
    expect(onImageSelected).not.toHaveBeenCalled();
  });
  it('cancels when leaving Generate for Upload even though its draft remains mounted', async () => {
    let finish!: (url: string) => void;
    vi.mocked(runImageGeneration).mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const { onImageSelected, showUpload } = await renderGenerate(1);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledOnce());
    const signal = vi.mocked(runImageGeneration).mock.calls[0][0].settings?.abortSignal;
    showUpload();
    expect(signal?.aborted).toBe(true);
    await act(async () => finish(imageUrl(0)));
    expect(addToHistory).not.toHaveBeenCalled();
    expect(onImageSelected).not.toHaveBeenCalled();
  });
});
