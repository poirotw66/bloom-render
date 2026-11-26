// @vitest-environment jsdom
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import { MaterialBasketProvider } from '../contexts/MaterialBasketContext';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { MATERIAL_BASKET_STORAGE_KEY } from '../utils/materialBasket';
import MaterialsPage from '../features/materials/MaterialsPage';
import TryOnMaterialPicker from '../features/tryon/TryOnMaterialPicker';
import { PoseMaterialFilters, type PoseFilterValues } from './PoseMaterialFields';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
});

function renderMaterials(path = '/materials') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <MaterialBasketProvider>
          <Routes>
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/materials/:id" element={<MaterialsPage />} />
          </Routes>
        </MaterialBasketProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

function Picker() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <TryOnMaterialPicker
      selectedIds={selectedIds}
      canAddClothing
      onSelect={async (material) => setSelectedIds([material.id])}
      onRemove={(id) => setSelectedIds((current) => current.filter((value) => value !== id))}
    />
  );
}

function renderPicker() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Picker />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('pose material controls', () => {
  it('labels controlled posture and view choices in the selected language', () => {
    localStorage.setItem('bloom_language', 'zh-TW');
    function Filters() {
      const [value, setValue] = useState<PoseFilterValues>({ posture: '', view: '' });
      return (
        <LanguageProvider>
          <PoseMaterialFilters value={value} onChange={setValue} />
        </LanguageProvider>
      );
    }
    render(<Filters />);
    fireEvent.change(screen.getByLabelText('姿態'), { target: { value: 'seated' } });
    fireEvent.change(screen.getByLabelText('拍攝視角'), { target: { value: 'profile' } });
    expect((screen.getByLabelText('姿態') as HTMLSelectElement).value).toBe('seated');
    expect((screen.getByLabelText('拍攝視角') as HTMLSelectElement).value).toBe('profile');
    expect(screen.getByRole('option', { name: '四分之三側面' })).toBeTruthy();
  });

  it('filters the catalog by posture and view without dropping the basket selection', async () => {
    renderMaterials();
    fireEvent.click(screen.getByTestId('basket-add-pose-relaxed-front'));
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'pose' } });
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(
      TRYON_MATERIALS.filter((material) => material.role === 'pose').length,
    );
    fireEvent.change(screen.getByLabelText('Posture'), { target: { value: 'seated' } });
    fireEvent.change(screen.getByLabelText('View', { exact: true }), {
      target: { value: 'profile' },
    });
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(1);
    expect(screen.getByTestId('basket-add-pose-seated-profile')).toBeTruthy();
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(MATERIAL_BASKET_STORAGE_KEY)!).materialBasket.materialIds,
      ).toEqual(['pose-relaxed-front']),
    );
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'all' } });
    expect(screen.queryByLabelText('Posture')).toBeNull();
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(TRYON_MATERIALS.length);
    expect(screen.getByTestId('basket-add-pose-relaxed-front').getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'pose' } });
    expect((screen.getByLabelText('Posture') as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText('View', { exact: true }) as HTMLSelectElement).value).toBe('');
  });

  it('shows an honest empty state for incompatible posture and view filters', () => {
    renderMaterials();
    fireEvent.change(screen.getByLabelText('Material type'), { target: { value: 'pose' } });
    fireEvent.change(screen.getByLabelText('Posture'), { target: { value: 'seated' } });
    fireEvent.change(screen.getByLabelText('View', { exact: true }), {
      target: { value: 'back' },
    });
    expect(screen.queryAllByTestId(/^basket-add-/)).toHaveLength(0);
    expect(screen.getByText('No materials match your search.')).toBeTruthy();
  });

  it('includes bilingual metadata labels and stable group IDs in catalog search', () => {
    renderMaterials();
    const query = screen.getByLabelText('Search materials');
    fireEvent.change(query, { target: { value: '四分之三側面' } });
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(
      TRYON_MATERIALS.filter((material) => material.pose?.view === 'three-quarter').length,
    );
    expect(screen.getByTestId('basket-add-pose-hand-on-hip')).toBeTruthy();
    fireEvent.change(query, { target: { value: 'ＴＨＲＥＥ－ＱＵＡＲＴＥＲ' } });
    expect(screen.getByTestId('basket-add-pose-hand-on-hip')).toBeTruthy();
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(
      TRYON_MATERIALS.filter((material) => material.pose?.view === 'three-quarter').length,
    );
    fireEvent.change(query, { target: { value: 'relaxed-standing' } });
    expect(screen.getAllByTestId(/^basket-add-/)).toHaveLength(1);
    expect(screen.getByTestId('basket-add-pose-relaxed-front')).toBeTruthy();
  });

  it('shows real pose metadata and leaves camera height unspecified without inventing other views', () => {
    const view = renderMaterials('/materials/pose-seated-profile');
    const details = screen.getByTestId('pose-metadata');
    expect(details.textContent).toContain('Pose groupSeated');
    expect(details.textContent).toContain('ViewProfile');
    expect(details.textContent).toContain('Camera heightNot specified');
    expect(details.textContent).toContain('FramingFull body');
    expect(details.textContent).toContain('Available viewsProfile');
    expect(details.textContent).not.toContain('90');
    expect(screen.getByText(/Pose and camera:.*view=profile/)).toBeTruthy();
    view.unmount();
    renderMaterials('/materials/white-oxford-shirt');
    expect(screen.queryByTestId('pose-metadata')).toBeNull();
  });

  it('preserves selected references while the try-on picker filters and resets categories', async () => {
    renderPicker();
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(TRYON_MATERIALS.length);
    fireEvent.click(screen.getByRole('button', { name: 'Pose' }));
    fireEvent.change(screen.getByLabelText('View', { exact: true }), {
      target: { value: 'front' },
    });
    const front = screen.getByTestId('tryon-material-pose-relaxed-front');
    fireEvent.click(front);
    await waitFor(() => expect(front.getAttribute('aria-pressed')).toBe('true'));
    fireEvent.change(screen.getByLabelText('View', { exact: true }), {
      target: { value: 'profile' },
    });
    expect(screen.queryByTestId('tryon-material-pose-relaxed-front')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.queryByLabelText('View', { exact: true })).toBeNull();
    expect(
      screen.getByTestId('tryon-material-pose-relaxed-front').getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(TRYON_MATERIALS.length);
    fireEvent.click(screen.getByRole('button', { name: 'Pose' }));
    expect((screen.getByLabelText('View', { exact: true }) as HTMLSelectElement).value).toBe('');
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(
      TRYON_MATERIALS.filter((material) => material.role === 'pose').length,
    );
  });

  it('finds metadata text in the try-on reference picker without changing the selected reference', () => {
    renderPicker();
    fireEvent.change(screen.getByLabelText('Search references'), { target: { value: '未標示' } });
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(3);
    fireEvent.change(screen.getByLabelText('Search references'), {
      target: { value: 'three-quarter' },
    });
    expect(screen.getAllByTestId(/^tryon-material-/)).toHaveLength(
      TRYON_MATERIALS.filter((material) => material.pose?.view === 'three-quarter').length,
    );
    expect(screen.getByTestId('tryon-material-pose-hand-on-hip')).toBeTruthy();
  });

  it('changes detail route and basket ID with the actual view and representation', async () => {
    renderMaterials('/materials/standing-study-front-lineart');
    fireEvent.change(screen.getByTestId('pose-view-select'), { target: { value: 'profile' } });
    await waitFor(() =>
      expect(screen.getByTestId('basket-add-standing-study-profile-lineart')).toBeTruthy(),
    );
    fireEvent.change(screen.getByTestId('pose-representation-select'), {
      target: { value: 'depth' },
    });
    const add = await screen.findByTestId('basket-add-standing-study-profile-depth');
    fireEvent.click(add);
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(MATERIAL_BASKET_STORAGE_KEY)!).materialBasket.materialIds,
      ).toEqual(['standing-study-profile-depth']),
    );
    expect(screen.getByTestId('pose-metadata').textContent).toContain('Depth map');
  });

  it('replaces the selected picker reference with its exact view and representation', async () => {
    renderPicker();
    fireEvent.click(screen.getByTestId('tryon-material-standing-study-front-lineart'));
    await waitFor(() => expect(screen.getByTestId('pose-view-select')).toBeTruthy());
    fireEvent.change(screen.getByTestId('pose-view-select'), { target: { value: 'back' } });
    await waitFor(() =>
      expect(
        screen
          .getByTestId('tryon-material-standing-study-back-lineart')
          .getAttribute('aria-pressed'),
      ).toBe('true'),
    );
    fireEvent.change(screen.getByTestId('pose-representation-select'), {
      target: { value: 'depth' },
    });
    await waitFor(() =>
      expect(
        screen.getByTestId('tryon-material-standing-study-back-depth').getAttribute('aria-pressed'),
      ).toBe('true'),
    );
    expect(
      screen
        .getByTestId('tryon-material-standing-study-front-lineart')
        .getAttribute('aria-pressed'),
    ).toBe('false');
    expect(
      screen.getByTestId('tryon-material-standing-study-back-lineart').getAttribute('aria-pressed'),
    ).toBe('false');
  });
});
