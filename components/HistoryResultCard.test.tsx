// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HistoryResultCard from './HistoryResultCard';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: state.language, t: (key: string) => key }),
}));
vi.mock('./ResultImage', () => ({ default: () => <div>Result</div> }));
vi.mock('./ResultActions', () => ({ default: () => null }));
vi.mock('./HistoryResultViewer', () => ({
  default: ({
    onClose,
    onReferenceNavigate,
  }: {
    onClose: () => void;
    onReferenceNavigate: () => void;
  }) => (
    <div role="dialog">
      <button onClick={onClose}>Close viewer</button>
      <button onClick={onReferenceNavigate}>Go to material</button>
    </div>
  ),
}));
afterEach(cleanup);
describe('shared history card reference viewer entry', () => {
  it.each([false, true])(
    'opens and closes from compact=%s without closing its parent',
    (compact) => {
      state.language = 'en';
      const afterNavigate = vi.fn();
      render(
        <MemoryRouter>
          <HistoryResultCard
            compact={compact}
            item={{ id: '1', type: 'tryon', timestamp: 1, blob: new Blob(), url: 'blob:result' }}
            index={0}
            onRemove={vi.fn()}
            onAfterNavigate={afterNavigate}
          />
        </MemoryRouter>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'View result and references' }));
      expect(screen.getByRole('dialog')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(afterNavigate).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'View result and references' }));
      afterNavigate.mockImplementation(() => expect(screen.queryByRole('dialog')).toBeNull());
      fireEvent.click(screen.getByRole('button', { name: 'Go to material' }));
      expect(afterNavigate).toHaveBeenCalledOnce();
    },
  );
  it('provides the Chinese viewer action', () => {
    state.language = 'zh-TW';
    render(
      <MemoryRouter>
        <HistoryResultCard
          item={{ id: '1', type: 'tryon', timestamp: 1, blob: new Blob(), url: 'blob:result' }}
          index={0}
          onRemove={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: '檢視結果與參考圖' })).toBeTruthy();
  });
});
