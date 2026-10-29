// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language, Messages } from '../locales/loadMessages';

let languageContext: typeof import('./LanguageContext');
const cached = new Map<Language, Messages>();
const load = vi.fn<(language: Language) => Promise<Messages>>();

function deferred() {
  let resolve!: (messages: Messages) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Messages>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Probe() {
  const { language, setLanguage, t } = languageContext.useLanguage();
  return (
    <>
      <output>
        {language}:{t('hello')}
      </output>
      <button onClick={() => setLanguage('zh-TW')}>Chinese</button>
      <button onClick={() => setLanguage('en')}>English</button>
    </>
  );
}

function mount() {
  const Provider = languageContext.LanguageProvider;
  return render(
    <Provider>
      <Probe />
    </Provider>,
  );
}

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
  cached.clear();
  cached.set('en', { hello: 'Hello' });
  load.mockReset();
  vi.doMock('../locales/loadMessages', () => ({
    getLoadedMessages: (language: Language) => cached.get(language),
    loadMessages: load,
  }));
  languageContext = await import('./LanguageContext');
});

afterEach(() => {
  cleanup();
  vi.doUnmock('../locales/loadMessages');
});

describe('language dictionary loading', () => {
  it('keeps keys hidden until the initial dictionary is ready', async () => {
    cached.clear();
    const pending = deferred();
    load.mockReturnValue(pending.promise);
    mount();
    expect(screen.getByRole('status').textContent).toBe('BloomRender…');
    expect(screen.queryByText('en:hello')).toBeNull();
    await act(async () => pending.resolve({ hello: 'Hello' }));
    expect(screen.getByText('en:Hello')).toBeTruthy();
  });

  it('keeps the current dictionary visible until a switch completes', async () => {
    const pending = deferred();
    load.mockReturnValue(pending.promise);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chinese' }));
    expect(screen.getByText('en:Hello')).toBeTruthy();
    expect(localStorage.getItem('bloom_language')).toBe('en');
    await act(async () => pending.resolve({ hello: '你好' }));
    expect(screen.getByText('zh-TW:你好')).toBeTruthy();
    expect(document.documentElement.lang).toBe('zh-TW');
    expect(localStorage.getItem('bloom_language')).toBe('zh-TW');
  });

  it('ignores an older language response after a newer choice', async () => {
    const pending = deferred();
    load.mockReturnValue(pending.promise);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chinese' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    await act(async () => pending.resolve({ hello: '你好' }));
    expect(screen.getByText('en:Hello')).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('bloom_language')).toBe('en');
  });

  it('renders a retryable initial-load error and recovers', async () => {
    cached.clear();
    load.mockRejectedValueOnce(new Error('Offline'));
    load.mockResolvedValueOnce({ hello: 'Hello' });
    mount();
    await screen.findByRole('alert');
    expect(screen.queryByText('en:hello')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('en:Hello');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('preserves the usable locale after a failed switch and can retry it', async () => {
    load.mockRejectedValueOnce(new Error('Offline'));
    load.mockResolvedValueOnce({ hello: '你好' });
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chinese' }));
    await screen.findByRole('alert');
    expect(screen.getByText('en:Hello')).toBeTruthy();
    expect(localStorage.getItem('bloom_language')).toBe('en');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('zh-TW:你好');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not commit a pending language after the provider unmounts', async () => {
    const pending = deferred();
    load.mockReturnValue(pending.promise);
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chinese' }));
    view.unmount();
    await act(async () => pending.resolve({ hello: '你好' }));
    expect(localStorage.getItem('bloom_language')).toBe('en');
  });
});
