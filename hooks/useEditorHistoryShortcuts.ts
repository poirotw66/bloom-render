/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo for the image editor.
 * Ignored while focus is in an input, textarea, or contenteditable.
 */

import { useEffect } from 'react';

function isEditableElement(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'));
}

export function useEditorHistoryShortcuts(options: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  enabled?: boolean;
}): void {
  const { canUndo, canRedo, onUndo, onRedo, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Prefer activeElement: synthetic key events often don't retarget to the focused field.
      if (isEditableElement(document.activeElement) || isEditableElement(event.target as Element)) {
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) onRedo();
        } else if (canUndo) {
          onUndo();
        }
        return;
      }
      // Ctrl+Y redo (Windows/Linux). Meta+Y is left alone (browser search history).
      if (key === 'y' && event.ctrlKey) {
        event.preventDefault();
        if (canRedo) onRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo, enabled]);
}
