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
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import * as materialFiles from '../../utils/materialFile';
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

  it('preserves the last result through edits and failed replacement, then retries its own snapshot', async () => {
    generateVirtualTryOn.mockResolvedValueOnce('data:image/png;base64,first');
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
    const firstPerson = samplePhoto('first-person.png');
    act(() => {
      result.current.setPerson(firstPerson);
      result.current.addClothing([samplePhoto('first-shirt.png')]);
    });
    await act(async () => {
      await result.current.handleGenerate();
    });
    const firstOriginal = result.current.resultPersonPreviewUrl;
    expect(result.current.style).toBe('original');
    expect(result.current.keepBackground).toBe(true);
    expect(result.current.automaticPrompt).not.toContain('High fashion editorial');
    act(() => {
      result.current.setPerson(samplePhoto('second-person.png'));
      result.current.clearClothing();
      result.current.addClothing([samplePhoto('second-shirt.png')]);
    });
    expect(result.current.result).toBe('data:image/png;base64,first');
    expect(result.current.resultPersonPreviewUrl).toBe(firstOriginal);
    generateVirtualTryOn.mockRejectedValueOnce(new Error('Provider unavailable'));
    await act(async () => {
      await result.current.handleGenerate();
    });
    expect(result.current.result).toBe('data:image/png;base64,first');
    expect(result.current.resultPersonPreviewUrl).toBe(firstOriginal);
    act(() => {
      result.current.setPerson(samplePhoto('third-person.png'));
      result.current.clearClothing();
      result.current.addClothing([samplePhoto('third-shirt.png')]);
    });
    generateVirtualTryOn.mockResolvedValueOnce('data:image/png;base64,retried-second');
    await act(async () => {
      await result.current.handleRetryFailed();
    });
    expect(generateVirtualTryOn.mock.calls.at(-1)?.[0].name).toBe('second-person.png');
    expect(generateVirtualTryOn.mock.calls.at(-1)?.[1][0].name).toBe('second-shirt.png');
    expect(result.current.results).toEqual(['data:image/png;base64,retried-second']);
    expect(result.current.result).toBeNull();
    expect(result.current.personFile?.name).toBe('third-person.png');
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

  it('applies shared settings before any saved draft and keeps the completed result while editing', async () => {
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
    await waitFor(() => expect(result.current.quantity).toBe(3));
    expect(result.current.hasResults).toBe(true);
    expect(result.current.result).toBe('data:image/png;base64,tryon');
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

it('preserves a new person when a failed incoming recipe falls back to saved references', async () => {
  let rejectMaterial!: (error: Error) => void;
  const material = vi.spyOn(materialFiles, 'materialFile').mockReturnValue(
    new Promise((_, reject) => {
      rejectMaterial = reject;
    }),
  );
  loadDraft.mockResolvedValue({
    person: { blob: samplePhoto('old-person.png'), name: 'old-person.png' },
    references: [
      { role: 'clothing', blob: samplePhoto('saved-shirt.png'), name: 'saved-shirt.png' },
    ],
    recipe: savedRecipe,
  } satisfies TryOnDraft);
  try {
    const incoming = { ...savedRecipe, materialIds: ['white-oxford-shirt'] };
    const { result } = renderHook(() => useTryOn(), {
      wrapper: withState({ tryOnRecipe: incoming }),
    });
    await waitFor(() => expect(result.current.materialLoading).toBe(true));
    const person = samplePhoto('new-person.png');
    act(() => result.current.setPerson(person));
    await act(async () => rejectMaterial(new Error('error.network_error')));
    await waitFor(() => expect(result.current.materialLoading).toBe(false));
    expect(result.current.personFile).toBe(person);
    expect(result.current.clothingFiles[0].name).toBe('saved-shirt.png');
    expect(result.current.draftStatus).not.toBe('loading');
  } finally {
    material.mockRestore();
  }
});

describe('try-on editable prompt', () => {
  it('keeps manual wording across settings and preserves the captured batch on retry', async () => {
    generateVirtualTryOn
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('error.blocked'))
      .mockResolvedValueOnce('retried');
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
    act(() => {
      result.current.setPerson(samplePhoto('person.png'));
      result.current.addClothing([samplePhoto('shirt.png')]);
      result.current.setQuantity(2);
      result.current.setPromptOverride('My captured prompt.');
    });
    act(() => result.current.setKeepPose(false));
    expect(result.current.resolvedPrompt).toBe('My captured prompt.');
    expect(result.current.referenceMap.map((ref) => ref.role)).toEqual(['person', 'clothing']);
    expect(
      result.current.referenceMap.map((ref) => ('materialId' in ref ? ref.materialId : undefined)),
    ).toEqual([undefined, undefined]);
    await act(async () => result.current.handleGenerate());
    expect(addToHistory.mock.calls[0][2].prompt).toBe('My captured prompt.');
    act(() => result.current.setPromptOverride('A later edit.'));
    await act(async () => result.current.handleRetryFailed());
    expect(generateVirtualTryOn.mock.calls[2][2].promptOverride).toBe('My captured prompt.');
    expect(addToHistory.mock.calls[1][2].recipe.promptOverride).toBe('My captured prompt.');
    act(() => result.current.setPromptOverride(undefined));
    expect(result.current.promptOverride).toBeUndefined();
    expect(result.current.resolvedPrompt).toBe(result.current.automaticPrompt);
  });
  it('restores custom wording from the saved draft and blocks blank manual generation', async () => {
    const recipe = {
      v: 1,
      kind: 'tryon',
      materialIds: [],
      promptOverride: 'Draft wording.',
      settings: {
        background: 'studio',
        style: 'editorial_high',
        quantity: 1,
        outputSize: '1K',
        aspectRatio: '9:16',
        keepBackground: false,
        keepPose: true,
      },
    };
    loadDraft.mockResolvedValue({
      person: { blob: samplePhoto('person.png'), name: 'person.png' },
      references: [{ role: 'clothing', blob: samplePhoto('shirt.png'), name: 'shirt.png' }],
      recipe,
    });
    const { result } = renderHook(() => useTryOn(), { wrapper });
    await waitFor(() => expect(result.current.resolvedPrompt).toBe('Draft wording.'));
    act(() => result.current.setPromptOverride('   '));
    expect(result.current.canGenerate).toBe(false);
    await act(async () => result.current.handleGenerate());
    expect(generateVirtualTryOn).not.toHaveBeenCalled();
    await waitFor(() => expect(saveDraft).toHaveBeenCalled());
    expect(saveDraft.mock.calls.at(-1)?.[0].recipe.promptOverride).toBe('   ');
  });
});

describe('basket route consumption', () => {
  const basketRecipe: TryOnRecipe = { ...savedRecipe, materialIds: ['white-oxford-shirt'] };
  const transfer = { tryOnRecipe: basketRecipe, fromMaterialBasket: true, retained: 'other-state' };
  function routeWrapper(state: unknown) {
    return function BasketRouteWrapper({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter
          initialEntries={[
            { pathname: '/try-on', search: '?source=basket', hash: '#workspace', state },
          ]}
        >
          <SettingsProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </SettingsProvider>
        </MemoryRouter>
      );
    };
  }
  function useRouteComposition() {
    return { tryOn: useTryOn(), location: useLocation(), navigate: useNavigate() };
  }

  it('keeps an immediate person upload while all basket references finish loading', async () => {
    const ids = ['white-oxford-shirt', 'pose-hand-on-hip', 'lighting-soft-window'];
    const completions = new Map<string, (file: File) => void>();
    const material = vi
      .spyOn(materialFiles, 'materialFile')
      .mockImplementation(
        (reference) => new Promise((resolve) => completions.set(reference.id, resolve)),
      );
    try {
      const state = { ...transfer, tryOnRecipe: { ...basketRecipe, materialIds: ids } };
      const { result } = renderHook(useRouteComposition, { wrapper: routeWrapper(state) });
      await waitFor(() => expect(result.current.tryOn.materialLoading).toBe(true));
      const person = samplePhoto('new-person.png');
      act(() => result.current.tryOn.setPerson(person));
      await act(async () => {
        for (const [id, complete] of completions) complete(samplePhoto(`${id}.png`));
      });
      await waitFor(() => expect(result.current.tryOn.materialLoading).toBe(false));
      expect(result.current.tryOn.personFile).toBe(person);
      expect(result.current.tryOn.materialIds).toEqual(ids);
      expect(result.current.tryOn.referenceMap.map((reference) => reference.role)).toEqual([
        'person',
        'clothing',
        'pose',
        'lighting',
      ]);
      expect(
        result.current.tryOn.referenceMap.map((reference) =>
          'materialId' in reference ? reference.materialId : undefined,
        ),
      ).toEqual([undefined, ...ids]);
      expect(result.current.tryOn.canGenerate).toBe(true);
      expect(result.current.location.state).toEqual({ retained: 'other-state' });
    } finally {
      material.mockRestore();
    }
  });

  it.each(['clothing', 'pose'] as const)(
    'does not overwrite a newer %s upload when an older basket finishes loading',
    async (role) => {
      const completions: Array<(file: File) => void> = [];
      const material = vi
        .spyOn(materialFiles, 'materialFile')
        .mockImplementation(() => new Promise((resolve) => completions.push(resolve)));
      try {
        const state = {
          ...transfer,
          tryOnRecipe: { ...basketRecipe, materialIds: ['white-oxford-shirt', 'pose-hand-on-hip'] },
        };
        const { result } = renderHook(useRouteComposition, { wrapper: routeWrapper(state) });
        await waitFor(() => expect(result.current.tryOn.materialLoading).toBe(true));
        const uploaded = samplePhoto(`new-${role}.png`);
        act(() => {
          if (role === 'clothing') result.current.tryOn.addClothing([uploaded]);
          else result.current.tryOn.setReference('pose', uploaded);
        });
        await act(async () => {
          for (const complete of completions) complete(samplePhoto('old-reference.png'));
        });
        await waitFor(() => expect(result.current.tryOn.materialLoading).toBe(false));
        expect(result.current.tryOn.materialIds).toEqual([]);
        if (role === 'clothing') expect(result.current.tryOn.clothingFiles).toEqual([uploaded]);
        else expect(result.current.tryOn.referenceFiles.pose).toBe(uploaded);
        expect(result.current.location.state).toEqual(state);
      } finally {
        material.mockRestore();
      }
    },
  );

  it('consumes a successful basket merge once, keeping other state and removed materials removed after reload', async () => {
    let complete!: (file: File) => void;
    const material = vi.spyOn(materialFiles, 'materialFile').mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    try {
      const first = renderHook(useRouteComposition, { wrapper: routeWrapper(transfer) });
      await waitFor(() => expect(first.result.current.tryOn.materialLoading).toBe(true));
      expect(first.result.current.location.state).toEqual(transfer);
      await act(async () => complete(samplePhoto('shirt.png')));
      await waitFor(() =>
        expect(first.result.current.location.state).toEqual({ retained: 'other-state' }),
      );
      expect(first.result.current.location.search).toBe('?source=basket');
      expect(first.result.current.location.hash).toBe('#workspace');
      expect(first.result.current.tryOn.materialIds).toEqual(['white-oxford-shirt']);
      act(() => first.result.current.tryOn.removeMaterial('white-oxford-shirt'));
      await waitFor(() => expect(saveDraft.mock.lastCall?.[0].recipe.materialIds).toEqual([]));
      const restoredState = first.result.current.location.state;
      const saved = saveDraft.mock.lastCall![0];
      first.unmount();
      loadDraft.mockResolvedValue(saved);
      const reloaded = renderHook(useRouteComposition, { wrapper: routeWrapper(restoredState) });
      await waitFor(() => expect(reloaded.result.current.tryOn.draftStatus).not.toBe('loading'));
      expect(reloaded.result.current.tryOn.materialIds).toEqual([]);
      expect(material).toHaveBeenCalledOnce();
    } finally {
      material.mockRestore();
    }
  });

  it('retains a failed transfer for retry without clearing its route state', async () => {
    const material = vi
      .spyOn(materialFiles, 'materialFile')
      .mockRejectedValue(new Error('error.network_error'));
    try {
      const { result } = renderHook(useRouteComposition, { wrapper: routeWrapper(transfer) });
      await waitFor(() => expect(result.current.tryOn.error).toBeTruthy());
      expect(result.current.location.state).toEqual(transfer);
      expect(result.current.tryOn.materialIds).toEqual([]);
    } finally {
      material.mockRestore();
    }
  });

  it('does not consume a basket replacement declined by the user', async () => {
    loadDraft.mockResolvedValue({
      person: null,
      references: [
        {
          role: 'pose',
          blob: samplePhoto('original-pose.png'),
          name: 'original-pose.png',
          materialId: 'pose-relaxed-front',
        },
      ],
      recipe: { ...savedRecipe, materialIds: ['pose-relaxed-front'] },
    });
    const declined = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const material = vi.spyOn(materialFiles, 'materialFile');
    const incoming = {
      ...transfer,
      tryOnRecipe: { ...basketRecipe, materialIds: ['pose-hand-on-hip'] },
    };
    try {
      const { result } = renderHook(useRouteComposition, { wrapper: routeWrapper(incoming) });
      await waitFor(() => expect(declined).toHaveBeenCalledOnce());
      expect(result.current.location.state).toEqual(incoming);
      expect(result.current.tryOn.materialIds).toEqual(['pose-relaxed-front']);
      expect(material).not.toHaveBeenCalled();
    } finally {
      declined.mockRestore();
      material.mockRestore();
    }
  });

  it('never clears newer navigation state when an earlier transfer finishes', async () => {
    let complete!: (file: File) => void;
    const material = vi.spyOn(materialFiles, 'materialFile').mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    try {
      const { result } = renderHook(useRouteComposition, { wrapper: routeWrapper(transfer) });
      await waitFor(() => expect(result.current.tryOn.materialLoading).toBe(true));
      act(() => result.current.navigate('/try-on?new=1#new', { state: { retained: 'new-state' } }));
      await act(async () => complete(samplePhoto('shirt.png')));
      await waitFor(() => expect(result.current.tryOn.materialLoading).toBe(false));
      expect(result.current.location.state).toEqual({ retained: 'new-state' });
      expect(result.current.location.search).toBe('?new=1');
      expect(result.current.location.hash).toBe('#new');
    } finally {
      material.mockRestore();
    }
  });

  it('can apply the same basket again through a new same-route navigation', async () => {
    const material = vi
      .spyOn(materialFiles, 'materialFile')
      .mockResolvedValue(samplePhoto('shirt.png'));
    try {
      const { result } = renderHook(useRouteComposition, { wrapper: routeWrapper(transfer) });
      await waitFor(() =>
        expect(result.current.location.state).toEqual({ retained: 'other-state' }),
      );
      act(() => result.current.tryOn.removeMaterial('white-oxford-shirt'));
      expect(result.current.tryOn.materialIds).toEqual([]);
      act(() => result.current.navigate('/try-on', { state: transfer }));
      await waitFor(() => expect(result.current.tryOn.materialIds).toEqual(['white-oxford-shirt']));
      await waitFor(() =>
        expect(result.current.location.state).toEqual({ retained: 'other-state' }),
      );
      expect(material).toHaveBeenCalledTimes(2);
    } finally {
      material.mockRestore();
    }
  });
});

describe('exact pose view and representation recovery', () => {
  it.each(['standing-study', 'hand-on-hip-study', 'seated-study'])(
    'replaces the selected %s pose atomically and keeps manual wording before saving exact inputs',
    async (group) => {
      const depth = TRYON_MATERIALS.find((material) => material.id === `${group}-profile-depth`)!;
      const back = TRYON_MATERIALS.find((material) => material.id === `${group}-back-lineart`)!;
      const files = vi
        .spyOn(materialFiles, 'materialFile')
        .mockImplementation(async (material) => samplePhoto(`${material.id}.png`));
      generateVirtualTryOn.mockResolvedValue('data:image/png;base64,exact-view');
      try {
        const { result } = renderHook(() => useTryOn(), { wrapper });
        await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
        act(() => {
          result.current.setPerson(samplePhoto('person.png'));
          result.current.addClothing([samplePhoto('shirt.png')]);
        });
        await act(async () => result.current.addMaterial(depth));
        expect(result.current.recipe.materialIds).toEqual([depth.id]);
        expect(result.current.resolvedPrompt).toContain('view=profile; cameraHeight=eye-level');
        expect(result.current.resolvedPrompt).toContain('Reference representation=depth.');
        act(() => result.current.setPromptOverride('Keep this exact manual instruction.'));
        await act(async () => result.current.addMaterial(back));
        expect(result.current.recipe.materialIds).toEqual([back.id]);
        expect(result.current.resolvedPrompt).toBe('Keep this exact manual instruction.');
        expect(result.current.referenceFiles.pose?.name).toBe(`${back.id}.png`);
        act(() => result.current.setPromptOverride(undefined));
        expect(result.current.resolvedPrompt).toContain('view=back; cameraHeight=eye-level');
        expect(result.current.resolvedPrompt).toContain('Reference representation=lineart.');
        await act(async () => result.current.handleGenerate());
        expect(generateVirtualTryOn.mock.calls[0][2].referenceFiles.pose.name).toBe(
          `${back.id}.png`,
        );
        const saved = addToHistory.mock.calls[0];
        expect(saved[2].recipe.materialIds).toEqual([back.id]);
        expect(saved[4]).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ role: 'pose', materialId: back.id, name: `${back.id}.png` }),
          ]),
        );
        await waitFor(() =>
          expect(saveDraft.mock.lastCall?.[0].recipe.materialIds).toEqual([back.id]),
        );
      } finally {
        files.mockRestore();
      }
    },
  );

  it.each([
    ['draft', 'standing-study'],
    ['history', 'standing-study'],
    ['draft', 'hand-on-hip-study'],
    ['history', 'hand-on-hip-study'],
    ['draft', 'seated-study'],
    ['history', 'seated-study'],
  ] as const)(
    'restores the precise depth camera reference from %s for %s',
    async (source, group) => {
      const material = TRYON_MATERIALS.find((item) => item.id === `${group}-three-quarter-depth`)!;
      const recipe: TryOnRecipe = { ...savedRecipe, materialIds: [material.id] };
      const references = [
        { role: 'clothing' as const, blob: samplePhoto('shirt.png'), name: 'shirt.png' },
        {
          role: 'pose' as const,
          blob: samplePhoto(`${material.id}.png`),
          name: `${material.id}.png`,
          materialId: material.id,
        },
      ];
      if (source === 'draft')
        loadDraft.mockResolvedValue({
          person: { blob: samplePhoto('person.png'), name: 'person.png' },
          references,
          recipe,
        } satisfies TryOnDraft);
      const state =
        source === 'history'
          ? buildHistoryReplayState(
              'tryon',
              { recipe },
              undefined,
              references,
              samplePhoto('person.png'),
            )
          : undefined;
      const { result } = renderHook(() => useTryOn(), {
        wrapper: state ? withState(state) : wrapper,
      });
      await waitFor(() => expect(result.current.referenceFiles.pose).toBeDefined());
      expect(result.current.recipe.materialIds).toEqual([material.id]);
      expect(result.current.referenceFiles.pose?.name).toBe(`${material.id}.png`);
      expect(result.current.resolvedPrompt).toContain('view=three-quarter; cameraHeight=eye-level');
      expect(result.current.resolvedPrompt).toContain('Reference representation=depth.');
      expect(result.current.resolvedPrompt).not.toContain('Reference representation=lineart.');
    },
  );
  it('reports a failed view replacement without erasing the selected pose', async () => {
    const old = TRYON_MATERIALS.find((material) => material.id === 'standing-study-front-lineart')!;
    const next = TRYON_MATERIALS.find(
      (material) => material.id === 'standing-study-profile-depth',
    )!;
    const files = vi
      .spyOn(materialFiles, 'materialFile')
      .mockResolvedValueOnce(samplePhoto(`${old.id}.png`))
      .mockRejectedValueOnce(new Error('error.network_error'));
    try {
      const { result } = renderHook(() => useTryOn(), { wrapper });
      await waitFor(() => expect(result.current.draftStatus).not.toBe('loading'));
      let loaded: boolean | undefined;
      await act(async () => {
        loaded = await result.current.addMaterial(old);
      });
      expect(loaded).toBe(true);
      await act(async () => {
        loaded = await result.current.addMaterial(next);
      });
      expect(loaded).toBe(false);
      expect(result.current.recipe.materialIds).toEqual([old.id]);
      expect(result.current.referenceFiles.pose?.name).toBe(`${old.id}.png`);
      expect(result.current.error).toBeTruthy();
    } finally {
      files.mockRestore();
    }
  });
});
