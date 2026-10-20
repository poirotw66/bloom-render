/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import {
  addSessionSpendUsd,
  readSessionSpendUsd,
  recordSessionSpendUsd,
  resetSessionSpendUsd,
  SESSION_SPEND_EVENT,
} from './sessionSpend';

afterEach(() => {
  resetSessionSpendUsd();
});

describe('sessionSpend', () => {
  it('starts at 0 and accumulates', () => {
    expect(readSessionSpendUsd()).toBe(0);
    expect(addSessionSpendUsd(0.04)).toBe(0.04);
    expect(addSessionSpendUsd(0.02)).toBeCloseTo(0.06);
    expect(readSessionSpendUsd()).toBeCloseTo(0.06);
  });

  it('ignores non-positive deltas', () => {
    addSessionSpendUsd(0.1);
    expect(addSessionSpendUsd(0)).toBeCloseTo(0.1);
    expect(addSessionSpendUsd(-1)).toBeCloseTo(0.1);
  });

  it('resets and notifies listeners', () => {
    let fired = 0;
    const handler = () => {
      fired += 1;
    };
    window.addEventListener(SESSION_SPEND_EVENT, handler);
    recordSessionSpendUsd(0.05);
    resetSessionSpendUsd();
    expect(readSessionSpendUsd()).toBe(0);
    window.dispatchEvent(new Event(SESSION_SPEND_EVENT));
    window.removeEventListener(SESSION_SPEND_EVENT, handler);
    expect(fired).toBeGreaterThanOrEqual(1);
  });
});
