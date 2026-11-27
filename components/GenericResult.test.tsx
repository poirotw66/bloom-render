// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GenericResult from './GenericResult';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('../contexts/SettingsContext', () => ({ useSettings: () => ({ isDemoMode: false }) }));
vi.mock('../hooks/useDisplayResult', () => ({
  useDisplayResult: (result: string) => ({ displayResult: result, onEnhanced: vi.fn() }),
}));
vi.mock('./ResultImage', () => ({ default: () => <div>Result preview</div> }));
vi.mock('./ResultActions', () => ({
  default: ({ extraActions }: { extraActions: React.ReactNode }) => (
    <div>
      <button>Download</button>
      {extraActions}
    </div>
  ),
}));
afterEach(cleanup);

describe('result task actions', () => {
  it('keeps a single-result generate-again action available', () => {
    const again = vi.fn();
    render(<GenericResult result="data:image/png;base64,fixture" onAgain={again} />);
    fireEvent.click(screen.getByRole('button', { name: 'start.idphoto_again' }));
    expect(again).toHaveBeenCalledOnce();
  });
  it('hides the clear-all action on individual batch cards while keeping download and edit', () => {
    render(
      <GenericResult
        result="data:image/png;base64,fixture"
        onAgain={vi.fn()}
        hideAgain
        onEditInEditor={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'start.idphoto_again' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'start.idphoto_edit' })).toBeTruthy();
  });
});
