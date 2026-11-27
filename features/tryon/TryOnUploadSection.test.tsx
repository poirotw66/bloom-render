// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import TryOnUploadSection from './TryOnUploadSection';
vi.mock('../../contexts/SettingsContext', () => ({ useSettings: () => ({ isDemoMode: false }) }));
vi.mock('../../components/CostEstimateBadge', () => ({ default: () => null }));
beforeEach(() => localStorage.setItem('bloom_language', 'en'));
afterEach(cleanup);
function setup(person: string | null, clothing: string[]) {
  const generate = vi.fn();
  const choose = vi.fn();
  render(
    <LanguageProvider>
      <TryOnUploadSection
        personPreviewUrl={person}
        clothingPreviewUrls={clothing}
        error={null}
        loading={false}
        isDraggingOver={false}
        canGenerate={Boolean(person && clothing.length)}
        minClothing={1}
        maxClothing={5}
        quantity={1}
        onQuantityChange={vi.fn()}
        onPersonFileChange={vi.fn()}
        onClothingFileChange={vi.fn()}
        onRemoveClothing={vi.fn()}
        onGenerate={generate}
        onChooseClothing={choose}
        onDragOver={vi.fn()}
        onDragLeave={vi.fn()}
        onDropPerson={vi.fn()}
        onDropClothing={vi.fn()}
      />
    </LanguageProvider>,
  );
  return { generate, choose };
}
describe('try-on next required input', () => {
  it('keeps validation and focuses the missing person photo', () => {
    const { generate } = setup(null, []);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Try-On' }));
    expect(generate).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Your Photo' }));
    expect(screen.getByTestId('tryon-readiness').textContent).toContain('Add a person photo');
  });
  it('focuses clothing selection when only the person is ready', () => {
    setup('blob:person', []);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Try-On' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Choose clothing' }));
  });
  it('announces ready inputs without moving focus back to an upload', () => {
    const { generate } = setup('blob:person', ['blob:shirt']);
    const button = screen.getByRole('button', { name: 'Generate Try-On' });
    button.focus();
    fireEvent.click(button);
    expect(generate).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(button);
    expect(screen.getByTestId('tryon-readiness').textContent).toContain(
      'Person and clothing ready',
    );
  });
});
