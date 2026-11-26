// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TryOnRecipe } from '../../types/tryOnRecipe';
import TryOnRecipeActions from './TryOnRecipeActions';

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const recipe: TryOnRecipe = {
  v: 1,
  kind: 'tryon',
  materialIds: ['white-oxford-shirt', 'pose-seated-profile'],
  settings: {
    background: 'studio',
    style: 'original',
    quantity: 1,
    outputSize: '1K',
    aspectRatio: '9:16',
    keepBackground: true,
    keepPose: true,
  },
  promptOverride: 'PRIVATE_NOTE: keep this out of shared recipes unless explicitly selected.',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function clipboard(writeText?: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('navigator', { clipboard: writeText ? { writeText } : undefined });
}

function mount(value = recipe) {
  render(<TryOnRecipeActions recipe={value} onApply={vi.fn()} />);
}

describe('TryOnRecipeActions sharing', () => {
  it('retains a private-data-free link when clipboard permission is denied', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    clipboard(writeText);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Copy recipe link' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Copy the link below.'),
    );
    const url = (screen.getByRole('textbox', { name: 'Recipe link' }) as HTMLInputElement).value;
    expect(writeText).toHaveBeenCalledWith(url);
    const payload = JSON.parse(Buffer.from(url.split('#')[1], 'base64url').toString());
    const { promptOverride: _privatePrompt, ...publicRecipe } = recipe;
    expect(payload).toEqual({ v: 1, f: 'tryon', recipe: publicRecipe });
    expect(JSON.stringify(payload)).not.toMatch(/PRIVATE_NOTE|data:|blob:|apiKey|photo/);
    expect(screen.queryByText(/prompt may be too long/)).toBeNull();
  });

  it('shows the generated link and confirms successful clipboard copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Copy recipe link' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Recipe link copied.'));
    expect(writeText).toHaveBeenCalledWith(
      (screen.getByRole('textbox', { name: 'Recipe link' }) as HTMLInputElement).value,
    );
  });

  it('offers manual copying when the clipboard API is unavailable', async () => {
    clipboard();
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Copy recipe link' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Copy the link below.'),
    );
    expect(
      (screen.getByRole('textbox', { name: 'Recipe link' }) as HTMLInputElement).value,
    ).toContain('#');
  });

  it('keeps the JSON fallback for an actual oversized opt-in prompt', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    mount({ ...recipe, promptOverride: 'x'.repeat(8000) });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include custom prompt in recipe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy recipe link' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('prompt may be too long'),
    );
    expect(screen.queryByRole('textbox', { name: 'Recipe link' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download recipe' })).toBeTruthy();
    expect(writeText).not.toHaveBeenCalled();
  });
});
