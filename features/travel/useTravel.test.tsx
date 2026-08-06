// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Covers the two behaviours that have actually broken in this hook, not the
 * whole surface: a stale-closure regression that silently dropped the user's
 * custom outfit/pose text, and a whole-batch failure that used to be
 * flattened to a generic "try again" message.
 *
 * Providers, not mocks, for settings/language: SettingsProvider and
 * LanguageProvider are plain in-memory context (localStorage + string
 * lookup), so wrapping in the real thing is both more honest and less code
 * than re-implementing their contracts as mocks. useHistory is different —
 * it's a module-level external store backed by real IndexedDB, shared by
 * every test in the process; mocking it at the module boundary keeps tests
 * isolated and avoids needing a fake-indexeddb dependency for behaviour this
 * task doesn't target.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useTravel } from './useTravel';

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

const generateTravelPhoto = vi.fn();
const generateOptimizedPrompt = vi.fn();

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    generateTravelPhoto: (...args: unknown[]) => generateTravelPhoto(...args),
    generateOptimizedPrompt: (...args: unknown[]) => generateOptimizedPrompt(...args),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </SettingsProvider>
  );
}

function samplePhoto(): File {
  return new File(['fake-bytes'], 'me.png', { type: 'image/png' });
}

beforeEach(() => {
  generateTravelPhoto.mockReset();
  generateOptimizedPrompt.mockReset();
  addToHistory.mockClear();
  // Custom-scene path calls this to auto-optimize the raw prompt; echoing it
  // back keeps that step a no-op for tests that don't care about it.
  generateOptimizedPrompt.mockImplementation(async (raw: string) => raw);
});

describe('useTravel handleGenerate', () => {
  it('reads the current custom outfit/pose text, not the value captured at mount', async () => {
    // The shipped regression: handleGenerate was memoised with a useCallback
    // dependency array missing customOutfitText/customPoseText, so once the
    // user typed something the callback kept using the text from first
    // render. generateDynamicTravelPrompt inlines these fields verbatim into
    // scenePrompt, so asserting on the mocked generateTravelPhoto call is a
    // direct read of what the closure actually saw.
    generateTravelPhoto.mockResolvedValue('data:image/png;base64,result');
    const { result } = renderHook(() => useTravel(), { wrapper });

    // Everything handleGenerate's useCallback deps other than the outfit/pose
    // text goes here, in one batch, so handleGenerate gets memoised once with
    // those settled and the outfit/pose text still blank.
    act(() => {
      result.current.setSelectedSceneId('custom');
      result.current.setCustomSceneText('a quiet street in Paris');
      result.current.setOutfit('custom');
      result.current.setPose('custom');
      result.current.setFilesFromDrop([samplePhoto()]);
    });

    // Now change ONLY the outfit/pose text, touching no other dependency of
    // handleGenerate. If those two fields were missing from the dependency
    // array (the shipped bug), handleGenerate would keep the memoised
    // function from the block above and never see this update.
    act(() => {
      result.current.setCustomOutfitText('a bright red trench coat');
      result.current.setCustomPoseText('leaning against a lamppost');
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(generateTravelPhoto).toHaveBeenCalledTimes(1);
    const optionsArg = generateTravelPhoto.mock.calls[0][1] as { scenePrompt: string };
    expect(optionsArg.scenePrompt).toContain('a bright red trench coat');
    expect(optionsArg.scenePrompt).toContain('leaning against a lamppost');
  });

  it('surfaces the first rejection real reason when the whole batch fails, not a generic message', async () => {
    // The other shipped regression: every flow used to report "All
    // generations failed. Please try again." no matter what actually broke —
    // including a missing API key, which the user could have fixed in
    // seconds if told.
    generateTravelPhoto.mockRejectedValue(new Error('error.api_key_missing'));
    const { result } = renderHook(() => useTravel(), { wrapper });

    act(() => {
      result.current.setSelectedSceneId('custom');
      result.current.setCustomSceneText('a quiet street in Paris');
      result.current.setFilesFromDrop([samplePhoto()]);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('API key not found. Please check your settings.');
    });
    // Not the generic fallback the regression used to always show.
    expect(result.current.error).not.toBe('All generations failed. Please try again.');
  });
});
