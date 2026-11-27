// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDialog } from './useDialog';
function Panel({ onClose }: { onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(true, onClose);
  return (
    <div ref={ref} tabIndex={-1} data-testid="parent-panel">
      <button>Parent action</button>
    </div>
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('useDialog nested native modal ownership', () => {
  it('leaves keyboard events to an actual native top-layer modal outside the parent', () => {
    const onClose = vi.fn();
    render(<Panel onClose={onClose} />);
    const modal = document.createElement('dialog');
    const child = document.createElement('button');
    modal.append(child);
    document.body.append(modal);
    const query = document.querySelector.bind(document);
    vi.spyOn(document, 'querySelector').mockImplementation((selector) =>
      selector === 'dialog:modal' ? modal : query(selector),
    );
    child.focus();
    fireEvent.keyDown(child, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    child.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    modal.remove();
  });
  it('keeps its own keyboard handling when :modal is unsupported or a modeless dialog is open', () => {
    const onClose = vi.fn();
    render(<Panel onClose={onClose} />);
    vi.spyOn(document, 'querySelector').mockImplementation(() => {
      throw new DOMException('unsupported');
    });
    fireEvent.keyDown(screen.getByTestId('parent-panel'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    vi.mocked(document.querySelector).mockReturnValue(null);
    fireEvent.keyDown(screen.getByTestId('parent-panel'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
