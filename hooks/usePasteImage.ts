/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared Ctrl/Cmd+V paste-image support for upload zones.
 */

import { useEffect, type RefObject } from 'react';

export function imageFileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  const items = data.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }
  const files = data.files;
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type.startsWith('image/')) return file;
    }
  }
  return null;
}

/**
 * When `containerRef` is focused (or contains the paste target), deliver the
 * first clipboard image to `onImage`. Set `enabled` false in demo mode.
 */
export function usePasteImage(
  containerRef: RefObject<HTMLElement | null>,
  onImage: (file: File) => void,
  options?: { enabled?: boolean },
): void {
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    const onPaste = (event: ClipboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const target = event.target;
      if (!(target instanceof Node) || !container.contains(target)) {
        // Also accept paste when the container itself is focused.
        if (document.activeElement !== container) return;
      }

      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      onImage(file);
    };

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [containerRef, enabled, onImage]);
}
