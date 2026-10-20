/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { aggregateFileProgress, clampPercent, normalizeHubProgress } from './progress';

describe('clampPercent', () => {
  it('clamps to 0–100', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(50)).toBe(50);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});

describe('normalizeHubProgress', () => {
  it('maps initiate / download / ready', () => {
    expect(normalizeHubProgress({ status: 'initiate', file: 'a.onnx' })).toEqual({
      percent: 0,
      statusKey: 'enhance.status_initiate',
      file: 'a.onnx',
    });
    expect(normalizeHubProgress({ status: 'download', file: 'a.onnx' }).statusKey).toBe(
      'enhance.status_download',
    );
    expect(normalizeHubProgress({ status: 'ready', task: 'background-removal' }).percent).toBe(100);
  });

  it('uses progress field when present', () => {
    const p = normalizeHubProgress({
      status: 'progress',
      progress: 42.5,
      loaded: 1,
      total: 10,
      file: 'model.onnx',
    });
    expect(p.percent).toBe(42.5);
    expect(p.statusKey).toBe('enhance.status_download');
  });

  it('falls back to loaded/total', () => {
    const p = normalizeHubProgress({
      status: 'progress',
      loaded: 25,
      total: 100,
      file: 'model.onnx',
    });
    expect(p.percent).toBe(25);
  });
});

describe('aggregateFileProgress', () => {
  it('averages per-file percents', () => {
    expect(aggregateFileProgress({})).toBe(0);
    expect(aggregateFileProgress({ a: 0, b: 100 })).toBe(50);
    expect(aggregateFileProgress({ a: 200, b: -10 })).toBe(50);
  });
});
