// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../contexts/SettingsContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import SettingsModal from './SettingsModal';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('bloom_language', 'en');
});

it('edits the direct OpenAI key and image model without changing another provider key', () => {
  sessionStorage.setItem('bloom_api_key', 'gemini-private');
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ThemeProvider>
          <SettingsProvider>
            <SettingsModal isOpen onClose={vi.fn()} />
          </SettingsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  const provider = screen.getByLabelText('Provider', { exact: true });
  fireEvent.change(provider, { target: { value: 'openai' } });
  const key = screen.getByLabelText('OpenAI API Key', { exact: true });
  expect(key.getAttribute('type')).toBe('password');
  fireEvent.change(key, { target: { value: 'openai-private' } });
  fireEvent.change(screen.getByLabelText('OpenAI image model'), {
    target: { value: 'gpt-image-1.5' },
  });
  expect(localStorage.getItem('bloom_openai_model')).toBe('gpt-image-1.5');
  expect(sessionStorage.getItem('bloom_openai_api_key')).toBe('openai-private');
  expect(localStorage.getItem('bloom_openai_api_key')).toBeNull();
  expect(
    screen.getByRole('link', { name: 'Create or manage an OpenAI API key' }).getAttribute('href'),
  ).toBe('https://platform.openai.com/api-keys');
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  expect(key.getAttribute('type')).toBe('text');
  fireEvent.change(provider, { target: { value: 'gemini' } });
  const geminiKey = screen.getByLabelText('API Key', { exact: true });
  expect((geminiKey as HTMLInputElement).value).toBe('gemini-private');
  expect(geminiKey.getAttribute('type')).toBe('password');
  fireEvent.change(provider, { target: { value: 'openai' } });
  expect((screen.getByLabelText('OpenAI API Key') as HTMLInputElement).value).toBe(
    'openai-private',
  );
  fireEvent.click(screen.getByTestId('remember-api-key'));
  expect(localStorage.getItem('bloom_openai_api_key')).toBe('openai-private');
});
