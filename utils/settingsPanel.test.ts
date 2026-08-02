/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  closeSettingsPanel,
  getSettingsPanelOpen,
  openSettingsPanel,
  resetSettingsPanelForTests,
  subscribeToSettingsPanel,
} from './settingsPanel';

afterEach(() => {
  resetSettingsPanelForTests();
});

describe('settingsPanel', () => {
  it('starts closed', () => {
    expect(getSettingsPanelOpen()).toBe(false);
  });

  it('opens and closes', () => {
    openSettingsPanel();
    expect(getSettingsPanelOpen()).toBe(true);

    closeSettingsPanel();
    expect(getSettingsPanelOpen()).toBe(false);
  });

  it('notifies subscribers on each transition', () => {
    const listener = vi.fn();
    subscribeToSettingsPanel(listener);

    openSettingsPanel();
    closeSettingsPanel();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stays quiet when the state would not change', () => {
    const listener = vi.fn();
    subscribeToSettingsPanel(listener);

    // The header button and the API-key notice both call openSettingsPanel;
    // a redundant call must not re-render every subscriber.
    openSettingsPanel();
    openSettingsPanel();
    closeSettingsPanel();
    closeSettingsPanel();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    subscribeToSettingsPanel(listener)();

    openSettingsPanel();

    expect(listener).not.toHaveBeenCalled();
  });

  it('returns a stable snapshot between transitions, as useSyncExternalStore requires', () => {
    openSettingsPanel();

    expect(getSettingsPanelOpen()).toBe(getSettingsPanelOpen());
  });
});
