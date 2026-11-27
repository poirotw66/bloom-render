// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import type { HistoryItem } from '../utils/historyDb';
import HistoryResultViewer from './HistoryResultViewer';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
vi.mock('../hooks/useUnsavedWork', () => ({ confirmDiscardUnsavedWork: vi.fn(() => true) }));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));
vi.mock('./ResultImage', () => ({
  default: ({ resultUrl }: { resultUrl: string }) => <img src={resultUrl} alt="Generated result" />,
}));
const createUrl = vi.fn();
const revokeUrl = vi.fn();
const item: HistoryItem = {
  id: 'record',
  type: 'tryon',
  timestamp: 1,
  blob: new Blob(['result']),
  url: 'blob:result-owned-by-store',
  sourceBlob: new Blob(['person'], { type: 'image/jpeg' }),
  references: [
    {
      role: 'clothing',
      blob: new Blob(['shirt'], { type: 'image/png' }),
      name: 'shirt.png',
      materialId: TRYON_MATERIALS[0].id,
    },
  ],
  options: {
    provider: 'openai',
    model: 'tested-model',
    prompt: 'Test prompt',
    remoteUrl: 'https://evil.example/private',
  },
};
beforeEach(() => {
  let id = 0;
  createUrl.mockReset().mockImplementation(() => `blob:reference-${++id}`);
  revokeUrl.mockReset();
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }),
  );
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function () {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function () {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});
describe('HistoryResultViewer', () => {
  it('shows ordered local inputs, exact material links, and allowlisted context', async () => {
    render(
      <MemoryRouter>
        <HistoryResultViewer item={item} onClose={vi.fn()} onReferenceNavigate={vi.fn()} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(createUrl).toHaveBeenCalledTimes(2));
    const list = screen.getByTestId('history-reference-list');
    expect(list.textContent).toContain('Image 1 · Original person');
    expect(list.textContent).toContain('Image 2 · Clothing');
    expect(screen.getByRole('link', { name: 'Open material' }).getAttribute('href')).toBe(
      `/materials/${TRYON_MATERIALS[0].id}`,
    );
    expect(screen.getByText('tested-model')).toBeTruthy();
    expect(screen.getByText('openai')).toBeTruthy();
    expect(document.body.innerHTML).not.toContain('evil.example');
  });
  it('shows the recorded imageProvider before the legacy provider field', () => {
    render(
      <MemoryRouter>
        <HistoryResultViewer
          item={{
            ...item,
            options: { imageProvider: 'recorded-provider', provider: 'legacy-provider' },
          }}
          onClose={vi.fn()}
          onReferenceNavigate={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('recorded-provider')).toBeTruthy();
    expect(screen.queryByText('legacy-provider')).toBeNull();
  });
  it('revokes only its owned URLs on item replacement and close', async () => {
    const view = render(
      <MemoryRouter>
        <HistoryResultViewer item={item} onClose={vi.fn()} onReferenceNavigate={vi.fn()} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(createUrl).toHaveBeenCalledTimes(2));
    view.rerender(
      <MemoryRouter>
        <HistoryResultViewer
          item={{ ...item, id: 'next', references: [] }}
          onClose={vi.fn()}
          onReferenceNavigate={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(revokeUrl).toHaveBeenCalledWith('blob:reference-2');
    view.unmount();
    expect(revokeUrl).toHaveBeenCalledWith('blob:reference-1');
    expect(revokeUrl).not.toHaveBeenCalledWith(item.url);
  });
  it('keeps an incomplete result viewable without inventing references', () => {
    render(
      <MemoryRouter>
        <HistoryResultViewer
          item={{ ...item, sourceBlob: undefined, references: undefined }}
          onClose={vi.fn()}
          onReferenceNavigate={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/does not contain all original inputs/)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Generated result' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(createUrl).not.toHaveBeenCalled();
  });
  it('labels a catalog fallback honestly and keeps the dialog open when navigation is declined', () => {
    const material = TRYON_MATERIALS[0];
    const onNavigate = vi.fn();
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValueOnce(false);
    render(
      <MemoryRouter>
        <HistoryResultViewer
          item={{
            ...item,
            sourceBlob: undefined,
            references: [
              { role: material.role, materialId: material.id, name: 'Legacy reference' } as never,
            ],
          }}
          onClose={vi.fn()}
          onReferenceNavigate={onNavigate}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Current catalog preview/)).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Open material' }));
    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('restores opener focus and preserves a parent scroll lock when cancelled', () => {
    document.body.style.overflow = 'hidden';
    function Parent() {
      const [open, setOpen] = useState(false);
      return (
        <MemoryRouter>
          <button onClick={() => setOpen(true)}>Inspect</button>
          {open && (
            <HistoryResultViewer
              item={item}
              onClose={() => setOpen(false)}
              onReferenceNavigate={vi.fn()}
            />
          )}
        </MemoryRouter>
      );
    }
    render(<Parent />);
    const opener = screen.getByRole('button', { name: 'Inspect' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: false, cancelable: true }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe('hidden');
  });
});
