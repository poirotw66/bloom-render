/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Whether the settings dialog is open, held outside React.
 *
 * The dialog is rendered by Header, but the thing that most often needs to open
 * it is far away: a feature page telling the user their API key is missing.
 * Threading a callback down every page for that is a lot of prop for one
 * button, so the open flag lives in a module-level store instead and anyone can
 * call openSettingsPanel().
 */

import { useSyncExternalStore } from 'react';

let isOpen = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToSettingsPanel(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSettingsPanelOpen(): boolean {
  return isOpen;
}

/** Server snapshot: nothing is open before hydration. */
function getServerSnapshot(): boolean {
  return false;
}

export function openSettingsPanel(): void {
  if (isOpen) return;
  isOpen = true;
  emit();
}

export function closeSettingsPanel(): void {
  if (!isOpen) return;
  isOpen = false;
  emit();
}

export function useSettingsPanelOpen(): boolean {
  return useSyncExternalStore(subscribeToSettingsPanel, getSettingsPanelOpen, getServerSnapshot);
}

/** Test seam: drop the open state and every subscriber. */
export function resetSettingsPanelForTests(): void {
  isOpen = false;
  listeners.clear();
}
