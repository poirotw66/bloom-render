// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { MaterialBasketProvider } from '../../contexts/MaterialBasketContext';
import { downloadMaterialBatchZip } from '../../utils/posewearMaterialBatch';
import MaterialsPage from './MaterialsPage';
vi.mock('../../utils/posewearMaterialBatch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/posewearMaterialBatch')>()),
  downloadMaterialBatchZip: vi.fn(),
}));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
  vi.mocked(downloadMaterialBatchZip).mockReset();
});
afterEach(cleanup);
function open() {
  render(
    <MemoryRouter>
      <LanguageProvider>
        <MaterialBasketProvider>
          <MaterialsPage />
        </MaterialBasketProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Batch selection' }));
  fireEvent.click(screen.getByTestId('material-batch-toggle-white-oxford-shirt'));
}
describe('catalog batch download and brief', () => {
  it('reports failed ZIP preparation and retains selection for a successful retry', async () => {
    vi.mocked(downloadMaterialBatchZip)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Download selected ZIP' }));
    await waitFor(() =>
      expect(screen.getByTestId('material-batch-feedback').textContent).toContain('please retry'),
    );
    expect(
      screen.getByTestId('material-batch-toggle-white-oxford-shirt').getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Download selected ZIP' }));
    await waitFor(() =>
      expect(screen.getByTestId('material-batch-feedback').textContent).toContain('downloaded'),
    );
    expect(downloadMaterialBatchZip).toHaveBeenCalledTimes(2);
    expect(downloadMaterialBatchZip).toHaveBeenLastCalledWith(['white-oxford-shirt']);
  });
  it('leaves an exact selectable brief when clipboard access is denied', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Copy selected brief' }));
    const fallback = await screen.findByRole('textbox', { name: 'Selected reference brief' });
    expect((fallback as HTMLTextAreaElement).value).toContain('white-oxford-shirt.svg');
    expect((fallback as HTMLTextAreaElement).value).toContain('Image 1');
  });
});
