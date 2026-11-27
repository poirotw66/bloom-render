// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResultActions from './ResultActions';
import { downloadImageAs } from '../utils/imageExport';
import { shareBrandedCard } from '../utils/shareResult';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));
vi.mock('../utils/imageExport', () => ({
  downloadImageAs: vi.fn().mockResolvedValue(undefined),
  withExtension: (name: string) => name,
}));
vi.mock('../utils/shareResult', () => ({
  shareBrandedCard: vi.fn().mockResolvedValue('downloaded'),
  shareResultImage: vi.fn().mockResolvedValue('downloaded'),
}));
vi.mock('../utils/pendingRemix', () => ({ peekPendingRemix: () => null }));
vi.mock('./LocalEnhanceActions', () => ({ default: () => <button>Local tools</button> }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('result export controls', () => {
  it('keeps each format selector independently labeled when multiple results are displayed', async () => {
    const view = render(
      <>
        <ResultActions result="data:image/png;base64,a" fileBaseName="first" />
        <ResultActions result="data:image/png;base64,b" fileBaseName="second" />
      </>,
    );
    const selectors = screen.getAllByRole('combobox', { name: 'result.download_format' });
    expect(selectors[0].id).not.toBe(selectors[1].id);
    fireEvent.change(selectors[1], { target: { value: 'webp' } });
    expect(selectors[0]).toHaveProperty('value', 'png');
    expect(selectors[1]).toHaveProperty('value', 'webp');
    fireEvent.click(screen.getAllByRole('button', { name: 'result.download' })[1]);
    expect(downloadImageAs).toHaveBeenCalledWith('data:image/png;base64,b', 'second', 'webp', 0.92);
    await screen.findByRole('status');
    view.unmount();
  });
  it('keeps download and share directly available with secondary image tools in an explicit disclosure', async () => {
    render(<ResultActions result="data:image/png;base64,a" />);
    expect(screen.getByRole('button', { name: 'result.download' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'result.share' })).toBeTruthy();
    const tools = screen.getByTestId('result-more-tools');
    expect(tools).toHaveProperty('open', false);
    fireEvent.click(screen.getByText('More image tools'));
    expect(tools).toHaveProperty('open', true);
    fireEvent.click(within(tools).getByRole('button', { name: 'result.share_card_story' }));
    expect(shareBrandedCard).toHaveBeenCalledWith(expect.objectContaining({ aspect: '9:16' }));
    await screen.findByRole('status');
  });
});
