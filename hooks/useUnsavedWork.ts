/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Guard for in-progress work that navigating away would discard.
 *
 * The editor keeps its undo stack in component state, so leaving /edit
 * unmounts it and the stack is gone — and every step in it cost an API call.
 * The nav tabs sit above the editor the whole time, so one stray click used to
 * silently throw the work away.
 *
 * The app mounts a plain BrowserRouter rather than a data router, so
 * react-router's useBlocker isn't available; links consult this registry on
 * click instead. window.confirm is deliberate here: cancelling a click has to
 * be synchronous, and closing the tab already goes through the browser's own
 * dialog via beforeunload, so a native prompt is the consistent choice.
 */

import { useEffect } from 'react';

type UnsavedWorkGuard = () => boolean;

let activeGuard: UnsavedWorkGuard | null = null;

/** True when the mounted route says it holds work that would be lost. */
export function hasUnsavedWork(): boolean {
  return activeGuard?.() ?? false;
}

/**
 * Ask before discarding, if there is anything to discard. Returns true when the
 * caller should go ahead with the navigation.
 */
export function confirmDiscardUnsavedWork(message: string): boolean {
  if (!hasUnsavedWork()) return true;
  return window.confirm(message);
}

/**
 * Register the calling route's "would this lose work?" predicate, and warn on
 * tab close / reload while it holds true.
 */
export function useUnsavedWork(hasWork: boolean): void {
  useEffect(() => {
    const guard: UnsavedWorkGuard = () => hasWork;
    activeGuard = guard;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasWork) return;
      // Browsers show their own wording; a non-empty returnValue is what opts in.
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only clear if this instance is still the active one, so a remount
      // (StrictMode double-invoke) doesn't leave the registry empty.
      if (activeGuard === guard) activeGuard = null;
    };
  }, [hasWork]);
}
