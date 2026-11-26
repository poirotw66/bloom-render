// @vitest-environment jsdom
import React, { useEffect, useMemo, useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MaterialBasketProvider, useMaterialBasket } from '../contexts/MaterialBasketContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ToolCommandsProvider, useToolCommands } from '../contexts/ToolCommandsContext';
import { useDialog } from '../hooks/useDialog';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import ToolHeader from './ToolHeader';

vi.mock('../hooks/useUnsavedWork', () => ({ confirmDiscardUnsavedWork: vi.fn(() => true) }));

function BasketProbe() {
  const basket = useMaterialBasket();
  return <output data-testid="basket-open">{basket.isOpen ? 'open' : 'closed'}</output>;
}

function CurrentRoute() {
  return <output data-testid="current-route">{useLocation().pathname}</output>;
}

function WorkspaceCommand() {
  const { setCommands } = useToolCommands();
  const [open, setOpen] = useState(false);
  const dialog = useDialog<HTMLDivElement>(open, () => setOpen(false));
  const commands = useMemo(
    () => [{ id: 'materials', label: 'Materials', onSelect: () => setOpen(true) }],
    [],
  );
  useEffect(() => {
    setCommands(commands);
    return () => setCommands([]);
  }, [commands, setCommands]);
  return open ? (
    <div ref={dialog} role="dialog" aria-label="Workspace materials" tabIndex={-1} />
  ) : null;
}

function mount(withCommand = false) {
  const onOpenHistory = vi.fn();
  const onOpenSettings = vi.fn();
  render(
    <MemoryRouter initialEntries={['/try-on']}>
      <LanguageProvider>
        <MaterialBasketProvider>
          <ToolCommandsProvider>
            <ToolHeader
              settingsOpen={false}
              historyOpen={false}
              onOpenHistory={onOpenHistory}
              onOpenSettings={onOpenSettings}
            />
            <CurrentRoute />
            <BasketProbe />
            {withCommand && <WorkspaceCommand />}
          </ToolCommandsProvider>
        </MaterialBasketProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  return { onOpenHistory, onOpenSettings };
}

beforeEach(() => {
  localStorage.setItem('bloom_language', 'en');
  vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(true);
});

describe('tool navigation', () => {
  it('opens the persistent basket from a route-independent command', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Material basket' }));
    expect(screen.getByTestId('basket-open').textContent).toBe('open');
  });

  it('closes the mobile tools menu before opening the basket', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'All photo tools' }));
    const menu = screen.getByRole('dialog', { name: 'All photo tools' });
    fireEvent.click(within(menu).getByRole('button', { name: 'Material basket' }));
    expect(screen.queryByRole('dialog', { name: 'All photo tools' })).toBeNull();
    expect(screen.getByTestId('basket-open').textContent).toBe('open');
  });

  it('runs registered commands directly from the toolbar', () => {
    mount(true);
    fireEvent.click(screen.getByRole('button', { name: 'Materials' }));
    expect(document.activeElement).toBe(
      screen.getByRole('dialog', { name: 'Workspace materials' }),
    );
  });

  it('closes the tools menu before transferring focus to a command dialog', () => {
    mount(true);
    const trigger = screen.getByRole('button', { name: 'All photo tools' });
    trigger.focus();
    fireEvent.click(trigger);
    const menu = screen.getByRole('dialog', { name: 'All photo tools' });
    fireEvent.click(within(menu).getByRole('button', { name: 'Materials' }));
    expect(screen.queryByRole('dialog', { name: 'All photo tools' })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('dialog', { name: 'Workspace materials' }),
    );
  });

  it('keeps history and settings directly available and labels the current tool', () => {
    const { onOpenHistory, onOpenSettings } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generation History' }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onOpenHistory).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'All photo tools' }).textContent).toContain(
      'AI Try-On',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens all tools, marks the active route, and restores focus on Escape', () => {
    mount();
    const trigger = screen.getByRole('button', { name: 'All photo tools' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'All photo tools' });
    expect(document.activeElement).toBe(dialog);
    expect(screen.getByRole('link', { name: 'AI Try-On' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: 'Reference materials' }).getAttribute('href')).toBe(
      '/materials',
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('navigates from the menu and respects the editor unsaved-work guard', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'All photo tools' }));
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(false);
    fireEvent.click(screen.getByRole('link', { name: 'Travel Photo' }));
    expect(screen.getByTestId('current-route').textContent).toBe('/try-on');
    expect(screen.getByRole('dialog')).toBeTruthy();
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(true);
    fireEvent.click(screen.getByRole('link', { name: 'Travel Photo' }));
    await waitFor(() => expect(screen.getByTestId('current-route').textContent).toBe('/travel'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
