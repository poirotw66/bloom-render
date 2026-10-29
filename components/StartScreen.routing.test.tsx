// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { SettingsProvider } from '../contexts/SettingsContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { usePasteImage } from '../hooks/usePasteImage';
import { runImageGeneration } from '../services/gemini/runImageGeneration';
import { buildHistoryReplayState, type HistoryReplayState } from '../utils/historyReplay';
import StartScreen from './StartScreen';

const { generatorImported } = vi.hoisted(() => ({ generatorImported: vi.fn() }));
vi.mock('./GenerateStartScreen', async (importOriginal) => {
  generatorImported();
  return importOriginal();
});
vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({ addToHistory: vi.fn(async () => 'history-id') }),
}));
vi.mock('../hooks/usePasteImage', () => ({ usePasteImage: vi.fn() }));
vi.mock('../services/gemini/runImageGeneration', () => ({ runImageGeneration: vi.fn() }));
vi.mock('../contexts/LanguageContext', async () => {
  const { enMessages } = await import('../locales/en');
  return {
    useLanguage: () => ({ language: 'en', t: (key: string) => enMessages[key] ?? key }),
  };
});
vi.mock('./StartScreenIntro', () => ({ default: () => null }));
vi.mock('./ViralTemplatesSection', () => ({
  default: () => <div data-testid="viral-templates" />,
}));
vi.mock('./HomeGallery', () => ({ default: () => null }));
vi.mock('./ExampleShowcase', () => ({ default: () => null }));
vi.mock('./ResultActions', () => ({ default: () => null }));

function Harness() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/')}>Open upload tab</button>
      <button onClick={() => navigate('/generate')}>Open generate tab</button>
      <button
        onClick={() =>
          navigate('/generate', {
            state: buildHistoryReplayState(
              'generate',
              { prompt: 'Second replay', aspectRatio: '4:3', numberOfImages: 2 },
              'blob:second-source',
            ),
          })
        }
      >
        Replay another generation
      </button>
      <p data-testid="pathname">{location.pathname}</p>
      <StartScreen
        tab={location.pathname === '/generate' ? 'generate' : 'upload'}
        onImageSelected={vi.fn()}
        navigate={navigate}
      />
    </>
  );
}

function setup(path = '/', state?: HistoryReplayState) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <ThemeProvider>
        <SettingsProvider>
          <Harness />
        </SettingsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(usePasteImage).mockClear();
  vi.mocked(runImageGeneration).mockReset();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ blob: async () => new Blob(['source'], { type: 'image/png' }) })),
  );
});

describe('start-screen routing compatibility', () => {
  it('does not import the generator on an initial upload visit', () => {
    setup();
    expect(generatorImported).not.toHaveBeenCalled();
    expect(screen.queryByTestId('generate-prompt')).toBeNull();
    expect(vi.mocked(usePasteImage).mock.lastCall?.[2]?.enabled).toBe(true);
  });

  it('retains drafts, quantity and paid results across upload/generate tab switches', async () => {
    vi.mocked(runImageGeneration)
      .mockResolvedValueOnce('data:image/png;base64,QQ==')
      .mockResolvedValueOnce('data:image/png;base64,Qg==');
    setup('/generate');
    const prompt = (await screen.findByTestId(
      'generate-prompt',
      {},
      { timeout: 10_000 },
    )) as HTMLTextAreaElement;
    fireEvent.change(prompt, { target: { value: 'Retained draft' } });
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Open upload tab' }));
    await waitFor(() => expect(screen.getAllByTestId('viral-templates')).toHaveLength(1));
    expect(screen.queryByTestId('generate-prompt')).toBeNull();
    expect(vi.mocked(usePasteImage).mock.lastCall?.[2]?.enabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Open generate tab' }));
    expect((screen.getByTestId('generate-prompt') as HTMLTextAreaElement).value).toBe(
      'Retained draft',
    );
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: '2' }).getAttribute('aria-pressed')).toBe('true');
    expect(vi.mocked(usePasteImage).mock.lastCall?.[2]?.enabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await screen.findByText('Select an image to edit');
    fireEvent.click(screen.getByRole('button', { name: 'Open upload tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open generate tab' }));
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('src'))).toEqual([
      'data:image/png;base64,QQ==',
      'data:image/png;base64,Qg==',
    ]);
    expect(runImageGeneration).toHaveBeenCalledTimes(2);
  });

  it('redirects a legacy home replay and applies prompt, options and source to the generator', async () => {
    vi.mocked(runImageGeneration).mockResolvedValue('data:image/png;base64,QQ==');
    setup(
      '/',
      buildHistoryReplayState(
        'generate',
        { prompt: 'Legacy replay', aspectRatio: '3:4', numberOfImages: 2 },
        'blob:legacy-source',
      ),
    );
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/generate'));
    await waitFor(() =>
      expect((screen.getByTestId('generate-prompt') as HTMLTextAreaElement).value).toBe(
        'Legacy replay',
      ),
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('blob:legacy-source'));
    expect(screen.getByRole('button', { name: '3:4' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Generate Image' }));
    await waitFor(() => expect(runImageGeneration).toHaveBeenCalledTimes(2));
    expect(vi.mocked(runImageGeneration).mock.calls[0][0].images?.[0].name).toBe(
      'generate-reference.png',
    );
  });

  it('applies another explicit replay while the generator is already mounted', async () => {
    setup(
      '/generate',
      buildHistoryReplayState('generate', { prompt: 'First replay', numberOfImages: 2 }),
    );
    await waitFor(() =>
      expect((screen.getByTestId('generate-prompt') as HTMLTextAreaElement).value).toBe(
        'First replay',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open upload tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replay another generation' }));
    await waitFor(() =>
      expect((screen.getByTestId('generate-prompt') as HTMLTextAreaElement).value).toBe(
        'Second replay',
      ),
    );
    expect(screen.getByRole('button', { name: '4:3' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('blob:second-source'));
  });
});
