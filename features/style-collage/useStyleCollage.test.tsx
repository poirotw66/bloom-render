// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { generateViralStyleImage } from '../../services/gemini/viralStyle';
import { composeStyleCollage } from '../../utils/composeStyleCollage';
import { useStyleCollage } from './useStyleCollage';

vi.mock('../../services/gemini/viralStyle', () => ({ generateViralStyleImage: vi.fn() }));
vi.mock('../../utils/composeStyleCollage', () => ({ composeStyleCollage: vi.fn() }));
vi.mock('../../hooks/useDemoSampleInput', () => ({ useDemoSampleInput: vi.fn() }));
vi.mock('../../utils/viralFavorites', () => ({ pushViralRecent: vi.fn() }));
vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    isDemoMode: false,
    effectiveApiKey: 'mock-key',
    effectiveModel: 'mock-model',
    imageProvider: 'gemini',
  }),
}));
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: translate }),
}));
vi.mock('../../services/gemini/shared', () => ({
  formatApiErrorMessage: (reason: unknown) =>
    reason instanceof Error ? reason.message : String(reason),
}));

function translate(key: string) {
  return key;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const selectedIds = ['figurine-box', 'polaroid-frame', 'taiwan-101', 'yearbook-90s'];
const requests: Array<ReturnType<typeof deferred<string>> & { signal?: AbortSignal }> = [];

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[{ pathname: '/style-collage', state: { selectedIds } }]}>
      {children}
    </MemoryRouter>
  );
}

function setup() {
  const hook = renderHook(() => useStyleCollage(), { wrapper });
  act(() =>
    hook.result.current.onFileChange(new File(['photo'], 'portrait.png', { type: 'image/png' })),
  );
  return hook;
}

beforeEach(() => {
  requests.length = 0;
  vi.mocked(generateViralStyleImage)
    .mockReset()
    .mockImplementation((_file, _prompt, settings) => {
      const request = { ...deferred<string>(), signal: settings?.abortSignal };
      requests.push(request);
      return request.promise;
    });
  vi.mocked(composeStyleCollage)
    .mockReset()
    .mockImplementation(
      async ({ tiles, mode }) =>
        `collage:${mode}:${tiles.map((tile) => tile.imageUrl ?? '_').join(',')}`,
    );
});

describe('style collage generation lifecycle', () => {
  it('publishes each successful or failed slot before the whole batch finishes', async () => {
    const { result } = setup();
    let run!: Promise<void>;
    act(() => {
      run = result.current.generateAll();
    });
    expect(requests).toHaveLength(2);
    expect(result.current.progress).toBe(0);
    await act(async () => requests[0].resolve('image-0'));
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(result.current.slots[0].resultUrl).toBe('image-0');
    expect(result.current.completed).toBe(1);
    expect(result.current.progress).toBe(25);
    expect(result.current.loading).toBe(true);
    expect(result.current.collageUrl).toContain('image-0');

    await act(async () => requests[1].reject(new Error('error.quota_exceeded')));
    expect(requests).toHaveLength(4);
    expect(result.current.slots[1].error).toBe('error.quota_exceeded');
    expect(result.current.progress).toBe(50);
    await act(async () => {
      requests[2].resolve('image-2');
      requests[3].resolve('image-3');
      await run;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.completed).toBe(3);
    expect(result.current.progress).toBe(100);
    expect(result.current.versions).toHaveLength(1);
  });

  it('cancel stops queued work, aborts active requests, and keeps completed results', async () => {
    const { result } = setup();
    let run!: Promise<void>;
    act(() => {
      run = result.current.generateAll();
    });
    await act(async () => requests[0].resolve('completed-image'));
    expect(requests).toHaveLength(3);
    await act(async () => {
      result.current.cancel();
      await run;
    });
    expect(requests.every((request) => request.signal?.aborted)).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.completed).toBe(1);
    expect(result.current.progress).toBe(25);
    expect(result.current.slots[0].resultUrl).toBe('completed-image');
    expect(
      result.current.slots.slice(1).every((slot) => slot.error === 'style_collage.cancelled'),
    ).toBe(true);
    expect(result.current.collageUrl).toContain('completed-image');
    await act(async () => {
      requests[1].resolve('late-image');
      requests[2].resolve('another-late-image');
    });
    expect(requests).toHaveLength(3);
    expect(result.current.slots.filter((slot) => slot.resultUrl)).toHaveLength(1);
  });

  it('unmount aborts requests and prevents queued work and composition', async () => {
    const { result, unmount } = setup();
    let run!: Promise<void>;
    act(() => {
      run = result.current.generateAll();
    });
    unmount();
    expect(requests.every((request) => request.signal?.aborted)).toBe(true);
    requests[0].resolve('late-0');
    requests[1].resolve('late-1');
    await run;
    expect(requests).toHaveLength(2);
    expect(composeStyleCollage).not.toHaveBeenCalled();
  });

  it('ignores late completions from a canceled run after a new run starts', async () => {
    const { result } = setup();
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.generateAll();
    });
    await act(async () => {
      result.current.cancel();
      await first;
    });
    act(() => {
      second = result.current.generateAll();
    });
    expect(requests).toHaveLength(4);
    await act(async () => {
      requests[0].resolve('stale-0');
      requests[1].resolve('stale-1');
      requests[2].resolve('current-0');
      requests[3].resolve('current-1');
    });
    expect(requests).toHaveLength(6);
    await act(async () => {
      requests[4].resolve('current-2');
      requests[5].resolve('current-3');
      await second;
    });
    expect(result.current.slots.map((slot) => slot.resultUrl)).toEqual([
      'current-0',
      'current-1',
      'current-2',
      'current-3',
    ]);
    expect(result.current.versions).toHaveLength(1);
    expect(result.current.collageUrl).not.toContain('stale');
  });

  it('retries a canceled slot without regenerating completed slots', async () => {
    const { result } = setup();
    let run!: Promise<void>;
    act(() => {
      run = result.current.generateAll();
    });
    await act(async () => requests[0].resolve('retained'));
    await act(async () => {
      result.current.cancel();
      await run;
    });
    let retry!: Promise<void>;
    act(() => {
      retry = result.current.retrySlot(1);
    });
    expect(requests).toHaveLength(4);
    expect(requests[3].signal?.aborted).toBe(false);
    await act(async () => {
      requests[3].resolve('recovered');
      await retry;
    });
    expect(result.current.slots[0].resultUrl).toBe('retained');
    expect(result.current.slots[1].resultUrl).toBe('recovered');
    expect(result.current.completed).toBe(2);
  });

  it('does not let an older layout composition overwrite the latest layout', async () => {
    vi.mocked(generateViralStyleImage).mockResolvedValue('image');
    const { result } = setup();
    await act(async () => {
      await result.current.generateAll();
    });
    const banner = deferred<string>();
    const story = deferred<string>();
    vi.mocked(composeStyleCollage).mockImplementation(({ mode }) =>
      mode === 'banner' ? banner.promise : story.promise,
    );
    act(() => result.current.setLayoutMode('banner'));
    act(() => result.current.setLayoutMode('story'));
    await act(async () => story.resolve('story-collage'));
    expect(result.current.collageUrl).toBe('story-collage');
    await act(async () => banner.resolve('old-banner-collage'));
    expect(result.current.collageUrl).toBe('story-collage');
  });

  it('changing the source file invalidates pending results and resets the collage', async () => {
    const { result } = setup();
    let run!: Promise<void>;
    act(() => {
      run = result.current.generateAll();
    });
    await act(async () => {
      result.current.onFileChange(new File(['new'], 'new.png'));
      await run;
      requests[0].resolve('old-image');
    });
    expect(result.current.slots).toEqual([]);
    expect(result.current.collageUrl).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(requests).toHaveLength(2);
  });

  it('saves the latest layout in the version when layout changes during final composition', async () => {
    vi.mocked(generateViralStyleImage).mockResolvedValue('image');
    const grid = deferred<string>();
    const story = deferred<string>();
    vi.mocked(composeStyleCollage).mockImplementation(({ mode }) =>
      mode === 'story' ? story.promise : grid.promise,
    );
    const { result } = setup();
    let run!: Promise<void>;
    act(() => {
      run = result.current.generateAll();
    });
    await waitFor(() => expect(composeStyleCollage).toHaveBeenCalledTimes(5));
    act(() => result.current.setLayoutMode('story'));
    await act(async () => grid.resolve('superseded-grid'));
    await act(async () => {
      story.resolve('latest-story');
      await run;
    });
    expect(result.current.versions).toHaveLength(1);
    expect(result.current.versions[0].collageUrl).toBe('latest-story');
    expect(result.current.collageUrl).toBe('latest-story');
  });
});
