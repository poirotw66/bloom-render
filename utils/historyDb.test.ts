/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  dataUrlToBlob,
  generateHistoryId,
  normalizeStoredRow,
  parseLegacyHistory,
  sortHistoryItems,
  splitOverflow,
  type StoredHistoryItem,
} from './historyDb';

/** 1x1 transparent PNG. */
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`;

function item(id: string, timestamp: number): StoredHistoryItem {
  return { id, type: 'portrait', blob: new Blob(['x'], { type: 'image/png' }), timestamp };
}

describe('sortHistoryItems', () => {
  it('sorts newest first', () => {
    const items = [item('a', 100), item('b', 300), item('c', 200)];
    expect(sortHistoryItems(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const items = [item('a', 100), item('b', 300)];
    const originalOrder = items.map((i) => i.id);
    sortHistoryItems(items);
    expect(items.map((i) => i.id)).toEqual(originalOrder);
  });
});

describe('splitOverflow', () => {
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
});

describe('generateHistoryId', () => {
  it('generates unique ids scoped by type', () => {
    const first = generateHistoryId('idphoto');
    const second = generateHistoryId('idphoto');
    expect(first).not.toEqual(second);
    expect(first.startsWith('idphoto-')).toBe(true);
  });
});

describe('dataUrlToBlob', () => {
  it('decodes a base64 data URL, preserving the MIME type', async () => {
    const blob = dataUrlToBlob(PNG_DATA_URL);
    expect(blob.type).toBe('image/png');
    // Decoded bytes are smaller than the base64 text that encoded them.
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.size).toBeLessThan(PNG_BASE64.length);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]); // PNG magic
  });

  it('handles a non-base64 data URL', async () => {
    const blob = dataUrlToBlob('data:text/plain,hello%20world');
    expect(blob.type).toBe('text/plain');
    expect(await blob.text()).toBe('hello world');
  });

  it('rejects anything that is not a data URL', () => {
    expect(() => dataUrlToBlob('https://example.com/a.png')).toThrow();
    expect(() => dataUrlToBlob('data:image/png;base64')).toThrow();
  });
});

describe('normalizeStoredRow', () => {
  it('passes a Blob row through untouched', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    const result = normalizeStoredRow({ id: 'a', type: 'portrait', timestamp: 1, blob });
    expect(result?.migrated).toBe(false);
    expect(result?.item.blob).toBe(blob);
  });

  it('converts a legacy data-URL row and flags it for rewriting', () => {
    const result = normalizeStoredRow({
      id: 'a',
      type: 'portrait',
      timestamp: 1,
      result: PNG_DATA_URL,
    });
    expect(result?.migrated).toBe(true);
    expect(result?.item.blob).toBeInstanceOf(Blob);
    expect(result?.item.blob.type).toBe('image/png');
  });

  it('carries options across a migration', () => {
    const result = normalizeStoredRow({
      id: 'a',
      type: 'portrait',
      timestamp: 1,
      result: PNG_DATA_URL,
      options: { portraitType: 'business' },
    });
    expect(result?.item.options).toEqual({ portraitType: 'business' });
  });

  it('drops a row that has neither a Blob nor a decodable data URL', () => {
    expect(normalizeStoredRow({ id: 'a', type: 'portrait', timestamp: 1 })).toBeNull();
    expect(
      normalizeStoredRow({ id: 'a', type: 'portrait', timestamp: 1, result: 'not-a-data-url' }),
    ).toBeNull();
  });
});

describe('parseLegacyHistory', () => {
  it('parses a legacy history blob', () => {
    const raw = JSON.stringify([{ id: 'a', type: 'portrait', timestamp: 1, result: PNG_DATA_URL }]);
    expect(parseLegacyHistory(raw)).toHaveLength(1);
  });

  it('treats missing, empty, or malformed legacy data as no history', () => {
    expect(parseLegacyHistory(null)).toEqual([]);
    expect(parseLegacyHistory('not json')).toEqual([]);
    expect(parseLegacyHistory(JSON.stringify({ not: 'an array' }))).toEqual([]);
  });
});
