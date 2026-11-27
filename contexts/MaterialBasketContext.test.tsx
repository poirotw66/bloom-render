// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaterialBasketProvider, useMaterialBasket } from './MaterialBasketContext';
import { MATERIAL_BASKET_STORAGE_KEY } from '../utils/materialBasket';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MaterialBasketProvider>{children}</MaterialBasketProvider>
);
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('persistent material basket', () => {
  it('preserves its catalog-only selection across provider remounts and dialog changes', async () => {
    const first = renderHook(useMaterialBasket, { wrapper });
    act(() => {
      first.result.current.addMaterial('white-oxford-shirt');
      first.result.current.addMaterial('pose-relaxed-front');
      first.result.current.openBasket();
    });
    expect(first.result.current.isOpen).toBe(true);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(MATERIAL_BASKET_STORAGE_KEY)!)).toEqual({
        materialBasket: { v: 1, materialIds: ['white-oxford-shirt', 'pose-relaxed-front'] },
      }),
    );
    act(() => first.result.current.closeBasket());
    expect(first.result.current.materialIds).toHaveLength(2);
    first.unmount();
    const restored = renderHook(useMaterialBasket, { wrapper });
    expect(restored.result.current.materialIds).toEqual([
      'white-oxford-shirt',
      'pose-relaxed-front',
    ]);
    expect(restored.result.current.isOpen).toBe(false);
    act(() => restored.result.current.removeMaterial('white-oxford-shirt'));
    expect(restored.result.current.materialIds).toEqual(['pose-relaxed-front']);
    act(() => restored.result.current.clear());
    expect(restored.result.current.materialIds).toEqual([]);
  });

  it('resets corrupt saved selections with visible feedback', () => {
    localStorage.setItem(MATERIAL_BASKET_STORAGE_KEY, '{broken');
    const view = renderHook(useMaterialBasket, { wrapper });
    expect(view.result.current.materialIds).toEqual([]);
    expect(view.result.current.message).toBe('invalid-saved-basket');
  });

  it('retains a usable selection when persistence is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError');
    });
    const view = renderHook(useMaterialBasket, { wrapper });
    act(() => view.result.current.addMaterial('white-oxford-shirt'));
    expect(view.result.current.materialIds).toEqual(['white-oxford-shirt']);
    expect(view.result.current.message).toBe('storage-unavailable');
  });
  it('undoes clear once with exact order, invalidates on edits and never persists undo', () => {
    const view = renderHook(useMaterialBasket, { wrapper });
    act(() => {
      view.result.current.addMaterials(['pose-relaxed-front', 'white-oxford-shirt']);
      view.result.current.clear();
    });
    expect(view.result.current.canUndoClear).toBe(true);
    expect(JSON.parse(localStorage.getItem(MATERIAL_BASKET_STORAGE_KEY)!)).toEqual({
      materialBasket: { v: 1, materialIds: [] },
    });
    act(() => view.result.current.undoClear());
    expect(view.result.current.materialIds).toEqual(['pose-relaxed-front', 'white-oxford-shirt']);
    expect(view.result.current.canUndoClear).toBe(false);
    act(() => {
      view.result.current.clear();
      view.result.current.addMaterial('white-oxford-shirt');
      view.result.current.undoClear();
    });
    expect(view.result.current.materialIds).toEqual(['white-oxford-shirt']);
    view.unmount();
    expect(renderHook(useMaterialBasket, { wrapper }).result.current.canUndoClear).toBe(false);
  });

  it('rejects batch conflicts atomically including existing references', () => {
    const view = renderHook(useMaterialBasket, { wrapper });
    act(() => view.result.current.addMaterial('pose-relaxed-front'));
    const before = view.result.current.materialIds;
    let outcome;
    act(() => {
      outcome = view.result.current.addMaterials(['white-oxford-shirt', 'pose-hand-on-hip']);
    });
    expect(outcome).toEqual({ ok: false, message: 'reference-conflict' });
    expect(view.result.current.materialIds).toBe(before);
    act(() => {
      view.result.current.addMaterial('white-oxford-shirt');
      view.result.current.addMaterials(['white-oxford-shirt']);
    });
    expect(view.result.current.materialIds).toEqual(['pose-relaxed-front', 'white-oxford-shirt']);
  });
});
