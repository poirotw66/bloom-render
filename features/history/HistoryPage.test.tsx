// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryPage from './HistoryPage';
import { downloadHistoryArchive } from '../../utils/historyArchive';

const state = vi.hoisted(() => ({ history: [] as Array<Record<string, unknown>> }));
vi.mock('../../utils/historyArchive', () => ({ downloadHistoryArchive: vi.fn() }));
vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ history: state.history, removeFromHistory: vi.fn(), clearHistory: vi.fn() }),
}));
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'night' }) }));
vi.mock('../../components/HistoryResultCard', () => ({ default: () => <article>Result</article> }));

beforeEach(() => {
  state.history = [
    {
      id: 'tryon-1',
      type: 'tryon',
      timestamp: 1,
      blob: new Blob(['a']),
      options: { style: 'editorial' },
    },
    {
      id: 'travel-1',
      type: 'travel',
      timestamp: 2,
      blob: new Blob(['b']),
      options: { sceneId: 'taipei' },
    },
  ];
  vi.mocked(downloadHistoryArchive).mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('history recipe export', () => {
  it('exports only the current filter and makes private inputs explicit', async () => {
    render(<HistoryPage onImageSelected={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'history.type.tryon' }));
    expect(screen.getByText(/exports include original photos and reference images/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Export images and recipes' }));
    await waitFor(() => expect(downloadHistoryArchive).toHaveBeenCalledWith([state.history[0]]));
  });

  it('prevents repeated clicks during an export and allows retry after an error', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(downloadHistoryArchive).mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    render(<HistoryPage onImageSelected={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Export images and recipes' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(downloadHistoryArchive).toHaveBeenCalledTimes(1));
    expect((screen.getByRole('button', { name: 'Exporting…' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    await act(async () => reject(new Error('ZIP failed')));
    expect(screen.getByRole('alert').textContent).toBe('Export failed. Please try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Export images and recipes' }));
    await waitFor(() => expect(downloadHistoryArchive).toHaveBeenCalledTimes(2));
  });
});
