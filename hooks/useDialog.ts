/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared behaviour for modal dialogs and side panels: Escape to close,
 * focus trap, focus restore on close, and background scroll lock.
 *
 * Returns a ref to attach to the dialog container. The container should carry
 * `tabIndex={-1}` so it can receive the initial focus.
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
  );
}

export function useDialog<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
): React.RefObject<T | null> {
  const containerRef = useRef<T>(null);

  // Callers usually pass an inline arrow; keep it in a ref so the effect below
  // only re-runs when the dialog actually opens or closes (re-running would
  // steal focus back to the container on every parent render).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !container) return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const isInside = active !== null && container.contains(active);

      if (event.shiftKey && (!isInside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!isInside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    const { overflow: prevOverflow, paddingRight: prevPaddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  return containerRef;
}
