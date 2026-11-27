// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';
import MaterialSearch from './MaterialSearch';
import { MATERIAL_SEARCH_HISTORY_KEY } from '../utils/posewearSearchSuggestions';
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
});
afterEach(cleanup);
function Search() {
  const [value, setValue] = React.useState('');
  return (
    <LanguageProvider>
      <MaterialSearch value={value} role="all" onChange={setValue} />
    </LanguageProvider>
  );
}
describe('catalog search history', () => {
  it('saves only committed queries, reuses them and clears local history', () => {
    render(<Search />);
    const input = screen.getByRole('searchbox', { name: 'Search materials' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '  seated  ' } });
    expect(localStorage.getItem(MATERIAL_SEARCH_HISTORY_KEY)).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(JSON.parse(localStorage.getItem(MATERIAL_SEARCH_HISTORY_KEY)!)).toEqual(['seated']);
    fireEvent.focus(input);
    const recent = screen.getByRole('region', { name: 'Recent searches' });
    fireEvent.click(within(recent).getByRole('button', { name: 'seated' }));
    expect((input as HTMLInputElement).value).toBe('seated');
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search history' }));
    expect(JSON.parse(localStorage.getItem(MATERIAL_SEARCH_HISTORY_KEY)!)).toEqual([]);
  });
  it('renders invalid persisted entries safely and Escape dismisses suggestions', () => {
    localStorage.setItem(MATERIAL_SEARCH_HISTORY_KEY, JSON.stringify([null, '<img src=x>', 5]));
    render(<Search />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    expect(screen.getByRole('button', { name: '<img src=x>' })).toBeTruthy();
    expect(document.querySelector('img')).toBeNull();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByTestId('material-search-suggestions')).toBeNull();
  });
  it('returns keyboard focus to search and closes after a focused suggestion commits', () => {
    render(<Search />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    const suggestion = within(
      screen.getByRole('region', { name: 'Suggested searches' }),
    ).getAllByRole('button')[0];
    suggestion.focus();
    fireEvent.click(suggestion);
    expect(document.activeElement).toBe(input);
    expect(screen.queryByTestId('material-search-suggestions')).toBeNull();
    fireEvent.focus(input);
    const recent = within(screen.getByRole('region', { name: 'Recent searches' })).getAllByRole(
      'button',
    )[0];
    recent.focus();
    fireEvent.keyDown(recent, { key: 'Escape' });
    expect(document.activeElement).toBe(input);
    expect(screen.queryByTestId('material-search-suggestions')).toBeNull();
  });
});
