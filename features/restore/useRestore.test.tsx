/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useRestore } from './useRestore';

vi.mock('../../services/geminiService', () => ({
  generateRestoredPhoto: vi.fn(async () => 'data:image/png;base64,restored'),
}));

vi.mock('../../services/localEnhance', () => ({
  upscale2x: vi.fn(async (url: string) => `${url}-up`),
}));

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ addToHistory: vi.fn(async () => 'id') }),
}));

vi.mock('../../hooks/useDemoSampleInput', () => ({
  useDemoSampleInput: () => undefined,
}));

vi.mock('../../hooks/useHistoryReplay', () => ({
  useHistoryReplay: () => undefined,
  fileFromSourceUrl: vi.fn(),
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    imageProvider: 'gemini',
    effectiveModel: 'gemini-test',
    toServiceSettings: () => ({ provider: 'gemini', apiKey: 'k', model: 'm' }),
  }),
}));

import { generateRestoredPhoto } from '../../services/geminiService';
import { upscale2x } from '../../services/localEnhance';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores with colorize and optional upscale', async () => {
    const { result } = renderHook(() => useRestore(), { wrapper });
    const file = new File([new Uint8Array([1])], 'old.png', { type: 'image/png' });

    act(() => {
      result.current.setFile(file);
      result.current.setColorize(true);
      result.current.setUpscaleAfter(true);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    await waitFor(() => expect(result.current.result).toBe('data:image/png;base64,restored-up'));
    expect(generateRestoredPhoto).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ colorize: true }),
    );
    expect(upscale2x).toHaveBeenCalled();
    expect(result.current.remixUrl).toContain('/r#');
  });
});
