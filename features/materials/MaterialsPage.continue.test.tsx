// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { MaterialBasketProvider } from '../../contexts/MaterialBasketContext';
import { confirmDiscardUnsavedWork } from '../../hooks/useUnsavedWork';
import MaterialsPage from './MaterialsPage';
vi.mock('../../hooks/useUnsavedWork', () => ({ confirmDiscardUnsavedWork: vi.fn(() => true) }));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
  vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(true);
});
afterEach(cleanup);
function Location() {
  const location = useLocation();
  return (
    <output data-testid="route">
      {location.pathname} {JSON.stringify(location.state)}
    </output>
  );
}
function setup() {
  render(
    <MemoryRouter initialEntries={['/materials']}>
      <LanguageProvider>
        <MaterialBasketProvider>
          <MaterialsPage />
          <Location />
        </MaterialBasketProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByTestId('basket-add-navy-tailored-jacket'));
}
describe('continue selected materials to try-on', () => {
  it('offers a direct next step and preserves exact selection and transfer semantics', () => {
    setup();
    expect(screen.getByTestId('material-selection-bar').textContent).toContain(
      '1 reference selected',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue to try-on' }));
    expect(screen.getByTestId('route').textContent).toContain('/try-on');
    expect(screen.getByTestId('route').textContent).toContain('navy-tailored-jacket');
    expect(screen.getByTestId('route').textContent).toContain('"fromMaterialBasket":true');
    expect(screen.getByTestId('route').textContent).toContain('"keepBackground":true');
  });
  it('keeps the current selection when navigation is declined', () => {
    setup();
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Continue to try-on' }));
    expect(screen.getByTestId('route').textContent).toContain('/materials');
    expect(screen.getByTestId('basket-add-navy-tailored-jacket').getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
