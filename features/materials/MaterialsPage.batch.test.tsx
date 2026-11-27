// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { MaterialBasketProvider } from '../../contexts/MaterialBasketContext';
import { MATERIAL_PREFERENCES_STORAGE_KEY } from '../../utils/materialPreferences';
import MaterialsPage from './MaterialsPage';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
});
afterEach(cleanup);
function openBatch() {
  const view = render(
    <MemoryRouter>
      <LanguageProvider>
        <MaterialBasketProvider>
          <MaterialsPage />
        </MaterialBasketProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Batch selection' }));
  return view;
}
function bar() {
  return within(screen.getByTestId('material-batch-toolbar'));
}

describe('material catalog batch operations', () => {
  it('selects displayed card faces and prunes filtered-out selections', () => {
    openBatch();
    fireEvent.click(bar().getByRole('button', { name: 'Select visible' }));
    expect(bar().getByText('11 selected')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'clothing' } });
    expect(bar().getByText('3 selected')).toBeTruthy();
    fireEvent.click(bar().getByRole('button', { name: 'Add favorites' }));
    const saved = JSON.parse(localStorage.getItem(MATERIAL_PREFERENCES_STORAGE_KEY)!);
    expect(saved.favoriteIds).toEqual([
      'white-oxford-shirt',
      'navy-tailored-jacket',
      'terracotta-midi-dress',
    ]);
    fireEvent.click(bar().getByRole('button', { name: 'Remove favorites' }));
    expect(JSON.parse(localStorage.getItem(MATERIAL_PREFERENCES_STORAGE_KEY)!).favoriteIds).toEqual(
      [],
    );
  });
  it('uses the exact back/depth variant and invalidates selection on variant changes', () => {
    const { container } = openBatch();
    const card = container
      .querySelector('[data-testid="material-batch-toggle-standing-study-front-lineart"]')!
      .closest('article')!;
    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Back' }));
    fireEvent.change(within(card as HTMLElement).getByLabelText('Reference representation'), {
      target: { value: 'standing-study-back-depth' },
    });
    fireEvent.click(bar().getByRole('button', { name: 'Select visible' }));
    fireEvent.click(bar().getByRole('button', { name: 'Add favorites' }));
    const favorites = JSON.parse(
      localStorage.getItem(MATERIAL_PREFERENCES_STORAGE_KEY)!,
    ).favoriteIds;
    expect(favorites).toContain('standing-study-back-depth');
    expect(favorites).not.toContain('standing-study-front-lineart');
    expect(favorites).toHaveLength(11);
    fireEvent.click(bar().getByRole('button', { name: 'Deselect all' }));
    fireEvent.click(screen.getByTestId('material-batch-toggle-standing-study-back-depth'));
    expect(bar().getByText('1 selected')).toBeTruthy();
    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Back' }));
    expect(bar().getByText('1 selected')).toBeTruthy();
    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Front' }));
    expect(bar().getByText('0 selected')).toBeTruthy();
  });
  it('adds a valid batch and clears selection after success', () => {
    openBatch();
    fireEvent.click(screen.getByTestId('material-batch-toggle-white-oxford-shirt'));
    fireEvent.click(screen.getByTestId('material-batch-toggle-pose-relaxed-front'));
    fireEvent.click(bar().getByRole('button', { name: 'Add selected to basket' }));
    expect(bar().getByText('0 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Material basket (2)' })).toBeTruthy();
  });
  it('retains selection when the atomic basket add rejects conflicting references', () => {
    openBatch();
    fireEvent.click(screen.getByTestId('material-batch-toggle-pose-relaxed-front'));
    fireEvent.click(screen.getByTestId('material-batch-toggle-pose-hand-on-hip'));
    fireEvent.click(bar().getByRole('button', { name: 'Add selected to basket' }));
    expect(bar().getByText('2 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Material basket (0)' })).toBeTruthy();
  });
});
