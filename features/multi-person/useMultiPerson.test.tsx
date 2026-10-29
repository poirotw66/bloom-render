// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runImageGeneration } from '../../services/gemini/runImageGeneration';
import { useMultiPerson } from './useMultiPerson';

vi.mock('../../services/gemini/runImageGeneration', () => ({ runImageGeneration: vi.fn() }));
vi.mock('../../hooks/useDemoSampleInput', () => ({ useDemoSampleFiles: () => undefined }));
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    imageProvider: 'gemini',
    effectiveModel: 'image-model',
    effectiveApiKey: 'mock-key-not-used',
    isDemoMode: false,
  }),
}));
vi.mock('../../utils/viralFavorites', () => ({ pushViralRecent: vi.fn() }));

function deferred() {
  let resolve!: (url: string) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mount() {
  const hook = renderHook(() => useMultiPerson(), {
    wrapper: ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>,
  });
  act(() => {
    hook.result.current.addFiles([
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ]);
  });
  return hook;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(runImageGeneration).mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('multi-person generation lifecycle', () => {
  it('aborts and stops progress immediately when cancelled without claiming completion', async () => {
    const pending = deferred();
    vi.mocked(runImageGeneration).mockReturnValue(pending.promise);
    const { result } = mount();
    act(() => result.current.generate());
    const signal = vi.mocked(runImageGeneration).mock.calls[0][0].settings?.abortSignal;
    expect(signal?.aborted).toBe(false);
    expect(result.current.loading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
      result.current.cancel();
    });
    expect(signal?.aborted).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.cancelled).toBe(true);
    expect(result.current.progress).toBeLessThan(100);
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => pending.resolve('late-image'));
    expect(result.current.resultUrl).toBeNull();
    expect(result.current.versions).toEqual([]);
  });

  it('aborts on unmount and ignores a provider that later resolves', async () => {
    const pending = deferred();
    vi.mocked(runImageGeneration).mockReturnValue(pending.promise);
    const { result, unmount } = mount();
    act(() => result.current.generate());
    const signal = vi.mocked(runImageGeneration).mock.calls[0][0].settings?.abortSignal;
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => pending.resolve('late-image'));
    expect(result.current.resultUrl).toBeNull();
  });

  it('ignores stale completion without stopping a newer run and prevents duplicate starts', async () => {
    const first = deferred();
    const second = deferred();
    vi.mocked(runImageGeneration)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = mount();
    act(() => {
      result.current.generate();
      result.current.generate();
      result.current.regenerate();
    });
    expect(runImageGeneration).toHaveBeenCalledTimes(1);
    act(() => result.current.cancel());
    act(() => result.current.generate());
    expect(runImageGeneration).toHaveBeenCalledTimes(2);
    expect(result.current.cancelled).toBe(false);

    await act(async () => first.resolve('stale'));
    expect(result.current.loading).toBe(true);
    expect(result.current.resultUrl).toBeNull();
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => second.resolve('current'));
    expect(result.current.loading).toBe(false);
    expect(result.current.resultUrl).toBe('current');
    expect(result.current.versions).toEqual(['current']);
    expect(result.current.progress).toBe(100);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps completed results and versions when a regeneration is cancelled', async () => {
    const pending = deferred();
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce('completed')
      .mockReturnValueOnce(pending.promise);
    const { result } = mount();
    await act(async () => result.current.generate());
    expect(result.current.resultUrl).toBe('completed');
    act(() => result.current.regenerate());
    expect(result.current.progress).toBe(0);
    act(() => result.current.cancel());
    await act(async () => pending.resolve('cancelled-version'));
    expect(result.current.resultUrl).toBe('completed');
    expect(result.current.versions).toEqual(['completed']);
    expect(result.current.activeVersion).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it('does not change files, template or selected version during a request', async () => {
    const pending = deferred();
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce('version-one')
      .mockResolvedValueOnce('version-two')
      .mockReturnValueOnce(pending.promise);
    const { result } = mount();
    await act(async () => result.current.generate());
    await act(async () => result.current.regenerate());
    const files = result.current.files;
    const templateId = result.current.templateId;
    act(() => {
      result.current.regenerate();
      result.current.removeAt(0);
      result.current.move(0, 1);
      result.current.addFiles([new File(['third'], 'third.png', { type: 'image/png' })]);
      result.current.setTemplateId('graduation-group');
      result.current.selectVersion(0);
    });
    expect(result.current.files).toBe(files);
    expect(result.current.templateId).toBe(templateId);
    expect(result.current.activeVersion).toBe(1);
    expect(result.current.resultUrl).toBe('version-two');
    act(() => result.current.cancel());
    await act(async () => pending.resolve('ignored'));
  });

  it('stops its timer after a real failure and permits a later successful run', async () => {
    vi.mocked(runImageGeneration)
      .mockRejectedValueOnce(new Error('error.quota_exceeded'))
      .mockResolvedValueOnce('retry-success');
    const { result } = mount();
    await act(async () => result.current.generate());
    expect(result.current.error).toBe('error.quota_exceeded');
    expect(result.current.progress).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => result.current.generate());
    expect(result.current.resultUrl).toBe('retry-success');
    expect(result.current.error).toBeNull();
  });
});
