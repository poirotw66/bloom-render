/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Syncs decorative background CSS animations with user settings and tab visibility.
 */

import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export function useBackgroundMotionPause(): void {
  const { enableBackgroundMotion } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      root.classList.toggle('background-motion-off', !enableBackgroundMotion);
      root.classList.toggle('animations-paused', enableBackgroundMotion && document.hidden);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('reduce-motion');
    }

    document.addEventListener('visibilitychange', sync);
    sync();

    return () => document.removeEventListener('visibilitychange', sync);
  }, [enableBackgroundMotion]);
}
