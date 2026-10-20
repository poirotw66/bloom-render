// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * EditorPage needs an initialFile via router state (otherwise it redirects
 * home). Providers stay real; geminiService + useHistory are mocked.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ROUTES } from '../../constants/routes';
import EditorPage from './EditorPage';

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

const generateEditedImage = vi.fn();
const generateFilteredImage = vi.fn();
const generateAdjustedImage = vi.fn();

vi.mock('../../services/geminiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/geminiService')>();
  return {
    ...actual,
    generateEditedImage: (...args: unknown[]) => generateEditedImage(...args),
    generateFilteredImage: (...args: unknown[]) => generateFilteredImage(...args),
    generateAdjustedImage: (...args: unknown[]) => generateAdjustedImage(...args),
  };
});

function samplePhoto(): File {
  return new File(['fake-bytes'], 'edit-me.png', { type: 'image/png' });
}

function renderEditor(initialFile?: File) {
  const entry = initialFile
    ? { pathname: ROUTES.EDIT, state: { initialFile } }
    : { pathname: ROUTES.EDIT };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[entry]}>
        <ThemeProvider>
          <SettingsProvider>
            <LanguageProvider>
              <Routes>
                <Route path={ROUTES.EDIT} element={children} />
                <Route path={ROUTES.HOME} element={<div>Home redirected</div>} />
              </Routes>
            </LanguageProvider>
          </SettingsProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return render(<EditorPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  generateEditedImage.mockReset();
  generateFilteredImage.mockReset();
  generateAdjustedImage.mockReset();
  addToHistory.mockClear();
});

describe('EditorPage', () => {
  it('redirects home when opened without an initial file', async () => {
    renderEditor();
    await waitFor(() => {
      expect(screen.getByText('Home redirected')).toBeTruthy();
    });
  });

  it('renders the editor chrome when seeded with an initial file', async () => {
    renderEditor(samplePhoto());
    await waitFor(() => {
      expect(screen.getByText('Retouch')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Generate' })).toBeTruthy();
    expect(screen.getByAltText('Current edited image')).toBeTruthy();
  });

  it('applies a filter through the mocked provider and records history', async () => {
    const filtered =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    generateFilteredImage.mockResolvedValue(filtered);
    renderEditor(samplePhoto());

    await waitFor(() => {
      expect(screen.getByText('Retouch')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Synthwave' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filter' }));

    await waitFor(() => {
      expect(generateFilteredImage).toHaveBeenCalledTimes(1);
    });
    expect(addToHistory).toHaveBeenCalledWith(
      'editor',
      filtered,
      expect.objectContaining({ tab: 'filters' }),
      expect.any(File),
    );
  });
});
