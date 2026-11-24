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
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useTryOn } from './useTryOn';
import { TRYON_MATERIALS } from '../../constants/tryOnMaterials';
import { buildHistoryReplayState } from '../../utils/historyReplay';
import type { TryOnRecipe } from '../../types/tryOnRecipe';
import type { TryOnDraft } from '../../utils/tryOnDraftDb';

const loadDraft = vi.fn();
const saveDraft = vi.fn();
const deleteDraft = vi.fn();
vi.mock('../../utils/tryOnDraftDb', () => ({
  loadTryOnDraft: (...args: unknown[]) => loadDraft(...args),
  saveTryOnDraft: (...args: unknown[]) => saveDraft(...args),
  deleteTryOnDraft: (...args: unknown[]) => deleteDraft(...args),
}));
vi.mock('../../hooks/useDemoSampleInput', () => ({ useDemoTryOnSamples: vi.fn() }));

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
  localStorage.clear();
  sessionStorage.clear();
  generateVirtualTryOn.mockReset();
  addToHistory.mockClear();
  loadDraft.mockReset().mockResolvedValue(null);
  saveDraft.mockReset().mockResolvedValue(undefined);
  deleteDraft.mockReset().mockResolvedValue(undefined);
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
      [expect.objectContaining({ role: 'clothing', name: 'shirt.png', blob: expect.any(File) })],
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

const savedRecipe: TryOnRecipe = {
  v: 1,
  kind: 'tryon',
  materialIds: [],
  settings: {
    background: 'garden',
    style: 'minimalist',
    outputSize: '2K',
    aspectRatio: '1:1',
    quantity: 3,
    keepBackground: true,
    keepPose: false,
  },
};
function withState(state: unknown) {
  return function HistoryWrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[{ pathname: '/tryon', state }]}>
        <SettingsProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </SettingsProvider>
      </MemoryRouter>
    );
  };
}

describe('try-on composition recovery', () => {
  it('restores the original person, both garments, role references and all settings from history', async () => {
    const person = samplePhoto('person.png');
    const state = buildHistoryReplayState(
      'tryon',
      { recipe: savedRecipe },
      'blob:expired',
      [
        { role: 'clothing', blob: samplePhoto('shirt.png'), name: 'shirt.png' },
        { role: 'clothing', blob: samplePhoto('pants.png'), name: 'pants.png' },
        { role: 'pose', blob: samplePhoto('pose.png'), name: 'pose.png' },
        { role: 'scene', blob: samplePhoto('scene.png'), name: 'scene.png' },
      ],
      person,
    );
    const { result } = renderHook(() => useTryOn(), { wrapper: withState(state) });
    await waitFor(() => expect(result.current.personFile).not.toBeNull());
    expect(result.current.clothingFiles.map((file) => file.name)).toEqual([
      'shirt.png',
      'pants.png',
    ]);
    expect(result.current.referenceFiles.pose?.name).toBe('pose.png');
    expect(result.current.referenceFiles.scene?.name).toBe('scene.png');
    expect(result.current.recipe.settings).toEqual(savedRecipe.settings);
    expect(result.current.canGenerate).toBe(true);
    expect(loadDraft).not.toHaveBeenCalled();
  });

  it('requires missing legacy clothing again instead of reusing an unrelated draft', async () => {
    const state = buildHistoryReplayState(
      'tryon',
      { background: 'garden' },
      undefined,
      undefined,
      samplePhoto('person.png'),
    );
    const { result } = renderHook(() => useTryOn(), { wrapper: withState(state) });
    await waitFor(() => expect(result.current.personFile).not.toBeNull());
    expect(result.current.clothingFiles).toHaveLength(0);
    expect(result.current.canGenerate).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(loadDraft).not.toHaveBeenCalled();
  });

  it('restores blobs and composition settings from the saved draft', async () => {
    loadDraft.mockResolvedValue({
      person: { blob: samplePhoto('me.png'), name: 'me.png' },
      references: [
        { role: 'clothing', blob: samplePhoto('coat.png'), name: 'coat.png' },
        { role: 'lighting', blob: samplePhoto('light.png'), name: 'light.png' },
      ],
      recipe: savedRecipe,
    } satisfies TryOnDraft);
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.personFile?.name).toBe('me.png'));
    expect(result.current.clothingFiles[0].name).toBe('coat.png');
    expect(result.current.referenceFiles.lighting?.name).toBe('light.png');
    expect(result.current.quantity).toBe(3);
    await waitFor(() => expect(result.current.draftStatus).toBe('saved'));
  });

  it('does not overwrite an upload with a draft that finishes loading later', async () => {
    let complete!: (draft: TryOnDraft) => void;
    loadDraft.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { result } = renderHook(() => useTryOn(), { wrapper });
    act(() => result.current.setPerson(samplePhoto('new.png')));
    await act(async () =>
      complete({
        person: { blob: samplePhoto('old.png'), name: 'old.png' },
        references: [],
        recipe: savedRecipe,
      }),
    );
    expect(result.current.personFile?.name).toBe('new.png');
  });

  it('saves uploaded files and role references without credentials or object URLs', async () => {
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
    act(() => {
      result.current.setPerson(samplePhoto('me.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
      result.current.setReference('expression', samplePhoto('smile.png'));
      result.current.setKeepBackground(true);
    });
    await waitFor(() => expect(saveDraft).toHaveBeenCalled());
    const draft = saveDraft.mock.lastCall![0] as TryOnDraft;
    expect(draft.person?.name).toBe('me.png');
    expect(draft.references.map((ref) => ref.role)).toEqual(['clothing', 'expression']);
    expect(draft.recipe.settings.keepBackground).toBe(true);
    expect(JSON.stringify(draft)).not.toContain('apiKey');
    expect(JSON.stringify(draft)).not.toContain('blob:');
  });

  it('clears all draft inputs and reports a failed deletion accurately', async () => {
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
    act(() => {
      result.current.setPerson(samplePhoto('me.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
    });
    await act(async () => {
      await result.current.clearDraft();
    });
    expect(deleteDraft).toHaveBeenCalledOnce();
    expect(result.current.personFile).toBeNull();
    expect(result.current.clothingFiles).toEqual([]);
    expect(result.current.draftStatus).toBe('empty');
    act(() => result.current.setPerson(samplePhoto('keep-on-error.png')));
    deleteDraft.mockRejectedValue(new Error('disk'));
    await act(async () => {
      await expect(result.current.clearDraft()).rejects.toThrow('disk');
    });
    expect(result.current.draftStatus).toBe('error');
    expect(result.current.personFile?.name).toBe('keep-on-error.png');
  });

  it('never reads or writes a private draft while demo mode is selected', async () => {
    localStorage.setItem('bloom_image_provider', 'demo');
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).toBe('empty'));
    expect(loadDraft).not.toHaveBeenCalled();
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('applies shared settings before any saved draft and returns to the form after a result', async () => {
    const { result } = renderHook(() => useTryOn(), {
      wrapper: withState({ tryOnRecipe: savedRecipe }),
    });
    await waitFor(() => expect(result.current.quantity).toBe(3));
    expect(loadDraft).not.toHaveBeenCalled();
    generateVirtualTryOn.mockResolvedValue('data:image/png;base64,tryon');
    act(() => {
      result.current.setPerson(samplePhoto('me.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
      result.current.setQuantity(1);
    });
    await act(async () => {
      await result.current.handleGenerate();
    });
    expect(result.current.hasResults).toBe(true);
    act(() => result.current.applyRecipe(savedRecipe));
    await waitFor(() => expect(result.current.hasResults).toBe(false));
    expect(result.current.quantity).toBe(3);
  });
});

describe('try-on composition lifecycle', () => {
  it('keeps the current composition when a recipe uses an unknown material', async () => {
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
    act(() => {
      result.current.setPerson(samplePhoto('me.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
    });
    const before = result.current.recipe;
    act(() => result.current.applyRecipe({ ...savedRecipe, materialIds: ['deleted-material'] }));
    expect(result.current.clothingFiles[0].name).toBe('shirt.png');
    expect(result.current.recipe).toEqual(before);
    expect(result.current.error).toBeTruthy();
  });
  it('keeps the current composition and saved draft when a recipe material fails to load', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
    act(() => {
      result.current.setPerson(samplePhoto('me.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
    });
    await waitFor(() => expect(saveDraft).toHaveBeenCalled());
    const before = result.current.recipe;
    const count = saveDraft.mock.calls.length;
    act(() => result.current.applyRecipe({ ...savedRecipe, materialIds: [TRYON_MATERIALS[0].id] }));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.clothingFiles[0].name).toBe('shirt.png');
    expect(result.current.recipe).toEqual(before);
    expect(saveDraft).toHaveBeenCalledTimes(count);
    fetchMock.mockRestore();
  });
  it('cancels an in-flight real generation before switching into demo mode', async () => {
    let complete!: (value: string) => void;
    generateVirtualTryOn.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { result } = renderHook(() => ({ tryOn: useTryOn(), settings: useSettings() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.tryOn.draftStatus).not.toBe('loading'));
    act(() => {
      result.current.tryOn.setPerson(samplePhoto('me.png'));
      result.current.tryOn.addClothing([samplePhoto('shirt.png')]);
    });
    let request!: Promise<void>;
    act(() => {
      request = result.current.tryOn.handleGenerate();
    });
    expect(result.current.tryOn.loading).toBe(true);
    act(() => result.current.settings.enableDemoMode());
    await act(async () => {
      complete('data:image/png;base64,late');
      await request;
    });
    expect(result.current.tryOn.loading).toBe(false);
    expect(result.current.tryOn.hasResults).toBe(false);
    expect(addToHistory).not.toHaveBeenCalled();
  });
  it('records the effective OpenRouter model instead of the Gemini model preference', async () => {
    localStorage.setItem('bloom_image_provider', 'openrouter');
    const { result } = renderHook(() => ({ tryOn: useTryOn(), settings: useSettings() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.tryOn.draftStatus).not.toBe('loading'));
    generateVirtualTryOn.mockResolvedValue('data:image/png;base64,result');
    act(() => {
      result.current.tryOn.setPerson(samplePhoto('me.png'));
      result.current.tryOn.addClothing([samplePhoto('shirt.png')]);
    });
    await act(async () => {
      await result.current.tryOn.handleGenerate();
    });
    expect(addToHistory.mock.lastCall![2].model).toBe(result.current.settings.effectiveModel);
    expect(addToHistory.mock.lastCall![2].provider).toBe('openrouter');
  });
});

it('recovers the saved draft when an incoming recipe cannot download its materials', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'));
  loadDraft.mockResolvedValue({
    person: { blob: samplePhoto('saved-me.png'), name: 'saved-me.png' },
    references: [
      { role: 'clothing', blob: samplePhoto('saved-shirt.png'), name: 'saved-shirt.png' },
    ],
    recipe: savedRecipe,
  } satisfies TryOnDraft);
  const incoming = { ...savedRecipe, materialIds: [TRYON_MATERIALS[0].id] };
  const { result } = renderHook(() => useTryOn(), {
    wrapper: withState({ tryOnRecipe: incoming }),
  });
  await waitFor(() => expect(result.current.personFile?.name).toBe('saved-me.png'));
  expect(result.current.clothingFiles[0].name).toBe('saved-shirt.png');
  expect(saveDraft).not.toHaveBeenCalled();
  expect(result.current.error).toBeTruthy();
  fetchMock.mockRestore();
});
