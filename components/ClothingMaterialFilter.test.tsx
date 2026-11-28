// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';
import { MaterialBasketProvider } from '../contexts/MaterialBasketContext';
import { MATERIAL_BASKET_STORAGE_KEY } from '../utils/materialBasket';
import MaterialsPage from '../features/materials/MaterialsPage';
import TryOnMaterialPicker from '../features/tryon/TryOnMaterialPicker';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
});
afterEach(cleanup);

function page() {
  render(
    <MemoryRouter>
      <LanguageProvider>
        <MaterialBasketProvider>
          <MaterialsPage />
        </MaterialBasketProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('clothing discovery controls', () => {
  it('filters the catalog and matches separated Chinese color/category terms without changing the basket', async () => {
    page();
    fireEvent.click(screen.getByTestId('basket-add-white-oxford-shirt'));
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'clothing' } });
    fireEvent.change(screen.getByLabelText('Clothing category'), { target: { value: 'top' } });
    fireEvent.change(screen.getByLabelText('Search materials'), {
      target: { value: '白色　上衣' },
    });
    expect(
      screen.getAllByTestId(/^basket-add-/).map((button) => button.getAttribute('data-testid')),
    ).toEqual([
      'basket-add-white-oxford-shirt',
      'basket-add-white-crew-neck-tee',
      'basket-add-white-cropped-shirt',
    ]);
    fireEvent.change(screen.getByLabelText('Clothing category'), { target: { value: 'dress' } });
    expect(screen.queryAllByTestId(/^basket-add-/)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByLabelText('Clothing category')).toHaveProperty('value', '');
    expect(screen.getByLabelText('Search materials')).toHaveProperty('value', '');
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(51);
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(MATERIAL_BASKET_STORAGE_KEY)!).materialBasket.materialIds,
      ).toEqual(['white-oxford-shirt']),
    );
    fireEvent.change(screen.getByLabelText('Clothing category'), { target: { value: 'dress' } });
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'pose' } });
    expect(screen.queryByLabelText('Clothing category')).toBeNull();
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'clothing' } });
    expect(screen.getByLabelText('Clothing category')).toHaveProperty('value', '');
  });

  it('localizes the five clothing categories', () => {
    localStorage.setItem('bloom_language', 'zh-TW');
    page();
    fireEvent.change(screen.getByLabelText('素材類型'), { target: { value: 'clothing' } });
    expect(screen.getByLabelText('服裝分類')).toBeTruthy();
    for (const name of ['全部服裝', '上衣', '褲裝', '裙裝', '外套', '洋裝'])
      expect(screen.getByRole('option', { name })).toBeTruthy();
  });

  it('keeps picker selection through categories, empty-result recovery and role changes', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    render(
      <MemoryRouter>
        <LanguageProvider>
          <TryOnMaterialPicker
            selectedIds={['white-oxford-shirt']}
            canAddClothing
            initialRole="clothing"
            onSelect={onSelect}
            onRemove={onRemove}
          />
        </LanguageProvider>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Clothing category'), { target: { value: 'top' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '白色 上衣' } });
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(3);
    expect(
      screen.getByTestId('tryon-material-white-oxford-shirt').getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.change(screen.getByLabelText('Clothing category'), { target: { value: 'dress' } });
    expect(screen.queryAllByTestId(/^tryon-material-/)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(51);
    expect(
      screen.getByTestId('tryon-material-white-oxford-shirt').getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.change(screen.getByLabelText('Clothing category'), { target: { value: 'trousers' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '褲子' } });
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(9);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pose' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clothing' }));
    expect(screen.getByLabelText('Clothing category')).toHaveProperty('value', '');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
