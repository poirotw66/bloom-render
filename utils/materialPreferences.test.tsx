// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import {
  MATERIAL_PREFERENCES_STORAGE_KEY,
  parseMaterialPreferences,
  recordMaterialUse,
  toggleMaterialFavorite,
  useMaterialPreferences,
} from './materialPreferences';

const [first, second] = TRYON_MATERIALS;
function State() {
  const state = useMaterialPreferences();
  return <output data-testid="preferences">{JSON.stringify(state)}</output>;
}
function current() {
  return JSON.parse(screen.getByTestId('preferences').textContent!);
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    MATERIAL_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ favoriteIds: [], recentIds: [] }),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('material preferences', () => {
  it('keeps only known deduplicated IDs from untrusted saved data', () => {
    expect(
      parseMaterialPreferences({
        favoriteIds: [first.id, first.id, 'unknown', 2],
        recentIds: [second.id, null, 'https://private.invalid/photo'],
      }),
    ).toEqual({ favoriteIds: [first.id], recentIds: [second.id] });
    expect(parseMaterialPreferences(null)).toEqual({ favoriteIds: [], recentIds: [] });
  });
  it('updates every mounted consumer and persists only material IDs', () => {
    render(<State />);
    act(() => toggleMaterialFavorite(first.id));
    expect(current().favoriteIds).toEqual([first.id]);
    expect(JSON.parse(localStorage.getItem(MATERIAL_PREFERENCES_STORAGE_KEY)!)).toEqual({
      favoriteIds: [first.id],
      recentIds: [],
    });
    act(() => toggleMaterialFavorite(first.id));
    expect(current().favoriteIds).toEqual([]);
  });
  it('records latest actual use first, deduplicates it, and ignores unknown IDs', () => {
    render(<State />);
    act(() => {
      recordMaterialUse(first.id);
      recordMaterialUse(second.id);
      recordMaterialUse(first.id);
      recordMaterialUse('missing');
    });
    expect(current().recentIds).toEqual([first.id, second.id]);
    expect(current().favoriteIds).toEqual([]);
  });
  it('loads malformed storage defensively and reacts to another tab', () => {
    localStorage.setItem(MATERIAL_PREFERENCES_STORAGE_KEY, '{bad json');
    render(<State />);
    expect(current().favoriteIds).toEqual([]);
    act(() => {
      localStorage.setItem(
        MATERIAL_PREFERENCES_STORAGE_KEY,
        JSON.stringify({ favoriteIds: [second.id], recentIds: [first.id] }),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: MATERIAL_PREFERENCES_STORAGE_KEY }));
    });
    expect(current().favoriteIds).toEqual([second.id]);
    expect(current().recentIds).toEqual([first.id]);
  });
  it('keeps this session usable when saving is unavailable', () => {
    render(<State />);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    act(() => toggleMaterialFavorite(first.id));
    expect(current().favoriteIds).toEqual([first.id]);
    expect(current().storageAvailable).toBe(false);
  });
});
