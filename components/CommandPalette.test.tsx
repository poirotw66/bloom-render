// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { CommandPaletteProvider, useCommandPalette } from '../contexts/CommandPaletteContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { MaterialBasketProvider } from '../contexts/MaterialBasketContext';
import { ToolCommandsProvider, useToolCommands } from '../contexts/ToolCommandsContext';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { getSettingsPanelOpen, resetSettingsPanelForTests } from '../utils/settingsPanel';

vi.mock('../hooks/useUnsavedWork', () => ({ confirmDiscardUnsavedWork: vi.fn(() => true) }));

function Probe({ workspaceAction }: { workspaceAction?: () => void }) {
  const palette = useCommandPalette();
  const { setCommands } = useToolCommands();
  useEffect(() => {
    if (workspaceAction)
      setCommands([{ id: 'prompt', label: 'Edit current prompt', onSelect: workspaceAction }]);
    return () => setCommands([]);
  }, [setCommands, workspaceAction]);
  return (
    <>
      <button onClick={palette?.openPalette}>Search tools and materials</button>
      <output data-testid="route">{useLocation().pathname}</output>
    </>
  );
}
function mount(workspaceAction?: () => void) {
  render(
    <MemoryRouter initialEntries={['/try-on']}>
      <LanguageProvider>
        <ThemeProvider>
          <MaterialBasketProvider>
            <ToolCommandsProvider>
              <CommandPaletteProvider>
                <Probe workspaceAction={workspaceAction} />
              </CommandPaletteProvider>
            </ToolCommandsProvider>
          </MaterialBasketProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}
async function open() {
  const trigger = screen.getByRole('button', { name: 'Search tools and materials' });
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('dialog', { name: 'Command palette' });
  return screen.getByRole('combobox', { name: 'Search commands' });
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bloom_language', 'en');
  vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(true);
  resetSettingsPanelForTests();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

describe('global command palette', () => {
  it('searches both material languages and navigates to the actual material', async () => {
    mount();
    const input = await open();
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: '正面自然站姿' } });
    expect(screen.getByRole('option', { name: /Relaxed front/ })).toBeTruthy();
    fireEvent.change(input, { target: { value: 'relaxed' } });
    expect(screen.getByRole('option', { name: /Relaxed front/ })).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('route').textContent).toBe('/materials/pose-relaxed-front');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('keeps the palette and draft in place if navigation is declined', async () => {
    mount();
    const input = await open();
    fireEvent.change(input, { target: { value: '/travel' } });
    vi.mocked(confirmDiscardUnsavedWork).mockReturnValue(false);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('route').textContent).toBe('/try-on');
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeTruthy();
  });
  it('supports keyboard selection and closes before running a workspace action', async () => {
    const action = vi.fn(() => expect(document.querySelector('dialog[open]')).toBeNull());
    mount(action);
    const input = await open();
    fireEvent.change(input, { target: { value: 'current prompt' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(action).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Search tools and materials' }),
    );
  });
  it('shows no-match feedback and opens settings without a second modal underneath', async () => {
    mount();
    const input = await open();
    fireEvent.change(input, { target: { value: 'nothing-matches-this' } });
    expect(screen.getByText('No matching tools or materials.').textContent).toContain(
      'No matching',
    );
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.change(input, { target: { value: 'api key' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(getSettingsPanelOpen()).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('opens with Ctrl+K, restores focus on cancel, and ignores other active dialogs', async () => {
    mount();
    const trigger = screen.getByRole('button', { name: 'Search tools and materials' });
    trigger.focus();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' });
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(trigger);
    const other = document.createElement('dialog');
    other.setAttribute('open', '');
    document.body.append(other);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await waitFor(() => expect(screen.queryByTestId('command-palette')).toBeNull());
    other.remove();
  });
});
