// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRYON_MATERIALS } from '../../constants/tryOnMaterials';
import TryOnMaterialPicker from './TryOnMaterialPicker';

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

afterEach(cleanup);

function mount(props: Partial<React.ComponentProps<typeof TryOnMaterialPicker>> = {}) {
  const onSelect = vi.fn().mockResolvedValue(undefined);
  const onRemove = vi.fn();
  render(
    <MemoryRouter>
      <TryOnMaterialPicker
        selectedIds={[]}
        canAddClothing
        onSelect={onSelect}
        onRemove={onRemove}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onSelect, onRemove };
}

describe('TryOnMaterialPicker', () => {
  it('filters by role and searches both catalog languages', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Pose' }));
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Select Oxford shirt' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '陶土' } });
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Select Midi dress' })).toBeTruthy();
  });

  it('selects a reference and lets selected references be removed at the clothing limit', async () => {
    const { onSelect } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Select Oxford shirt' }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(TRYON_MATERIALS[0]));
    cleanup();
    const { onRemove } = mount({ selectedIds: ['white-oxford-shirt'], canAddClothing: false });
    expect(
      (screen.getByRole('button', { name: 'Select Navy jacket' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Select Relaxed front' }) as HTMLButtonElement).disabled,
    ).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Oxford shirt' }));
    expect(onRemove).toHaveBeenCalledWith('white-oxford-shirt');
  });

  it('keeps browsing available while selection is disabled in demo or busy mode', () => {
    const { onSelect } = mount({ disabled: true });
    fireEvent.click(screen.getByRole('button', { name: 'Select Oxford shirt' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Oxford shirt details' }).getAttribute('href')).toBe(
      '/materials/white-oxford-shirt',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lighting' }));
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(2);
  });

  it('reports an asset loading failure without losing the selection controls', async () => {
    mount({ onSelect: vi.fn().mockRejectedValue(new Error('fetch failed')) });
    fireEvent.click(screen.getByRole('button', { name: 'Select Oxford shirt' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Select Oxford shirt' }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );
  });
});
