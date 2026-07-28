/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  generateHistoryId,
  parseLegacyHistory,
  sortHistoryItems,
  splitOverflow,
  type HistoryItem,
} from './historyDb';

function item(id: string, timestamp: number): HistoryItem {
  return { id, type: 'portrait', result: 'data:image/png;base64,x', timestamp };
}

describe('historyDb pure helpers', () => {
  it('sorts newest first', () => {
    const items = [item('a', 100), item('b', 300), item('c', 200)];
    expect(sortHistoryItems(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input array when sorting', () => {
    const items = [item('a', 100), item('b', 300)];
    const original = [...items];
    sortHistoryItems(items);
    expect(items).toEqual(original);
  });

  it('keeps everything when under the cap', () => {
    const items = sortHistoryItems([item('a', 3), item('b', 2), item('c', 1)]);
    const { keep, overflow } = splitOverflow(items, 5);
    expect(keep).toHaveLength(3);
    expect(overflow).toHaveLength(0);
  });

  it('splits the oldest items into overflow once past the cap', () => {
    const items = sortHistoryItems([item('a', 3), item('b', 2), item('c', 1)]);
    const { keep, overflow } = splitOverflow(items, 2);
    expect(keep.map((i) => i.id)).toEqual(['a', 'b']);
    expect(overflow.map((i) => i.id)).toEqual(['c']);
  });

  it('generates unique ids scoped by type', () => {
    const first = generateHistoryId('idphoto');
    const second = generateHistoryId('idphoto');
    expect(first).not.toEqual(second);
    expect(first.startsWith('idphoto-')).toBe(true);
  });

  it('parses a legacy history blob', () => {
    const raw = JSON.stringify([item('a', 1)]);
    expect(parseLegacyHistory(raw)).toEqual([item('a', 1)]);
  });

  it('treats missing, empty, or malformed legacy data as no history', () => {
    expect(parseLegacyHistory(null)).toEqual([]);
    expect(parseLegacyHistory('not json')).toEqual([]);
    expect(parseLegacyHistory(JSON.stringify({ not: 'an array' }))).toEqual([]);
  });
});
