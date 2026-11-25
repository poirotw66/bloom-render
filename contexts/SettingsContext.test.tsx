// @vitest-environment jsdom
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsProvider, useSettings } from './SettingsContext';
import { DEFAULT_OPENAI_MODEL } from '../services/imageProviders';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('provider settings', () => {
  it('keeps three credentials independent while switching provider and reloading', () => {
    const first = renderHook(useSettings, { wrapper });
    act(() => {
      first.result.current.setApiKey('gemini-test');
      first.result.current.setOpenRouterApiKey('router-test');
      first.result.current.setOpenAIApiKey('openai-test');
      first.result.current.setOpenAIModel('gpt-image-1.5');
      first.result.current.setImageProvider('openai');
    });
    expect(first.result.current.toServiceSettings()).toMatchObject({
      provider: 'openai',
      apiKey: 'openai-test',
      model: 'gpt-image-1.5',
    });
    expect(localStorage.getItem('bloom_openai_api_key')).toBeNull();
    act(() => first.result.current.setImageProvider('gemini'));
    expect(first.result.current.effectiveApiKey).toBe('gemini-test');
    act(() => first.result.current.setImageProvider('openrouter'));
    expect(first.result.current.effectiveApiKey).toBe('router-test');
    act(() => first.result.current.setImageProvider('openai'));
    first.unmount();
    const reloaded = renderHook(useSettings, { wrapper });
    expect(reloaded.result.current.effectiveApiKey).toBe('openai-test');
    expect(reloaded.result.current.effectiveModel).toBe('gpt-image-1.5');
    expect(reloaded.result.current.apiKey).toBe('gemini-test');
    expect(reloaded.result.current.openRouterApiKey).toBe('router-test');
  });

  it('resolves an unsupported stored OpenAI model and restores remembered credentials', () => {
    localStorage.setItem('bloom_openai_model', 'text-model');
    localStorage.setItem('bloom_image_provider', 'openai');
    localStorage.setItem('bloom_remember_api_key', 'true');
    for (const key of ['bloom_api_key', 'bloom_openrouter_api_key', 'bloom_openai_api_key'])
      localStorage.setItem(key, key + '-test');
    const { result } = renderHook(useSettings, { wrapper });
    expect(result.current.openAIModel).toBe(DEFAULT_OPENAI_MODEL);
    expect(result.current.effectiveApiKey).toBe('bloom_openai_api_key-test');
    expect(sessionStorage.getItem('bloom_openai_api_key')).toBe('bloom_openai_api_key-test');
    act(() => result.current.setRememberApiKey(false));
    for (const key of ['bloom_api_key', 'bloom_openrouter_api_key', 'bloom_openai_api_key']) {
      expect(localStorage.getItem(key)).toBeNull();
      expect(sessionStorage.getItem(key)).toBe(key + '-test');
    }
  });
});
