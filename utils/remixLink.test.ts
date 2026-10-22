/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  buildRemixUrl,
  decodeRemixPayload,
  encodeRemixPayload,
  parseRemixHash,
  type RemixPayload,
} from './remixLink';
import { SITE_BASE_PATH, SITE_ORIGIN } from '../constants/site';

describe('remixLink', () => {
  it('roundtrips viral template id form', () => {
    const payload: RemixPayload = { v: 1, id: 'figurine-box' };
    const encoded = encodeRemixPayload(payload);
    expect(encoded).not.toContain('=');
    expect(encoded).not.toMatch(/[+\/]/);
    expect(decodeRemixPayload(encoded)).toEqual(payload);
  });

  it('roundtrips full prompt form with optional fields', () => {
    const payload: RemixPayload = {
      v: 1,
      f: 'generate',
      p: 'soft golden-hour portrait, natural light',
      a: '3:4',
      q: 2,
      tab: 'retouch',
    };
    const encoded = encodeRemixPayload(payload);
    expect(decodeRemixPayload(encoded)).toEqual(payload);
  });

  it('rejects oversized prompt on encode', () => {
    const payload: RemixPayload = {
      v: 1,
      f: 'filter',
      p: 'x'.repeat(501),
    };
    expect(() => encodeRemixPayload(payload)).toThrow(/500/);
  });

  it('rejects bad id on encode and returns null on decode', () => {
    expect(() => encodeRemixPayload({ v: 1, id: 'Bad_ID' })).toThrow();
    expect(() => encodeRemixPayload({ v: 1, id: 'UPPER' })).toThrow();
    expect(() => encodeRemixPayload({ v: 1, id: '-leading' })).toThrow();
    expect(() => encodeRemixPayload({ v: 1, id: 'a'.repeat(65) })).toThrow();

    const crafted = btoa(JSON.stringify({ v: 1, id: 'Bad_ID' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeRemixPayload(crafted)).toBeNull();
  });

  it('rejects unknown / image-related keys on encode', () => {
    expect(() =>
      encodeRemixPayload({ v: 1, id: 'ok', image: 'x' } as unknown as RemixPayload),
    ).toThrow(/image/);
    expect(() =>
      encodeRemixPayload({
        v: 1,
        f: 'generate',
        p: 'hi',
        photo: 'x',
      } as unknown as RemixPayload),
    ).toThrow(/photo/);
    expect(() =>
      encodeRemixPayload({
        v: 1,
        f: 'generate',
        p: 'hi',
        dataUrl: 'data:image/png;base64,xx',
      } as unknown as RemixPayload),
    ).toThrow(/dataUrl/);
  });

  it('returns null for image keys or garbage on decode', () => {
    const withImage = btoa(JSON.stringify({ v: 1, id: 'ok', image: 'x' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeRemixPayload(withImage)).toBeNull();

    const withPhoto = btoa(JSON.stringify({ v: 1, f: 'generate', p: 'a', photo: 'x' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeRemixPayload(withPhoto)).toBeNull();

    const withDataUrl = btoa(
      JSON.stringify({ v: 1, f: 'generate', p: 'a', dataUrl: 'data:image/png;base64,xx' }),
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeRemixPayload(withDataUrl)).toBeNull();

    expect(decodeRemixPayload('')).toBeNull();
    expect(decodeRemixPayload('!!!')).toBeNull();
    expect(decodeRemixPayload('not-base64-json')).toBeNull();
  });

  it('buildRemixUrl uses site defaults and /r# fragment', () => {
    const url = buildRemixUrl({ v: 1, id: 'figurine-box' });
    expect(url.startsWith(`${SITE_ORIGIN}${SITE_BASE_PATH}/r#`)).toBe(true);
    const hash = url.slice(url.indexOf('#') + 1);
    expect(decodeRemixPayload(hash)).toEqual({ v: 1, id: 'figurine-box' });
  });

  it('buildRemixUrl accepts origin/basePath overrides', () => {
    const url = buildRemixUrl(
      { v: 1, id: 'figurine-box' },
      { origin: 'https://example.test', basePath: '/app' },
    );
    expect(url).toMatch(/^https:\/\/example\.test\/app\/r#/);
  });

  it('parseRemixHash accepts # prefix or raw', () => {
    const encoded = encodeRemixPayload({ v: 1, id: 'figurine-box' });
    expect(parseRemixHash(`#${encoded}`)).toEqual({ v: 1, id: 'figurine-box' });
    expect(parseRemixHash(encoded)).toEqual({ v: 1, id: 'figurine-box' });
    expect(parseRemixHash('#')).toBeNull();
    expect(parseRemixHash('')).toBeNull();
  });

  it('strips control characters from prompt on decode', () => {
    const dirty = { v: 1, f: 'adjust' as const, p: 'hello\u0000world\u0007' };
    const encoded = btoa(JSON.stringify(dirty))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeRemixPayload(encoded)).toEqual({
      v: 1,
      f: 'adjust',
      p: 'helloworld',
    });
  });
});
