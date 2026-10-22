/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Remix-link payload encode/decode for URL hash (Wave O foundation).
 * Payloads never carry image bytes or image URLs — only template ids or
 * short prompt metadata for the future /r remix route.
 */

import { SITE_BASE_PATH, SITE_ORIGIN } from '../constants/site';

/** Preferred short form: viral template id. */
export type RemixIdPayload = { v: 1; id: string };

/** Full prompt form for generate / retouch / adjust / filter / restore flows. */
export type RemixPromptPayload = {
  v: 1;
  f: 'generate' | 'retouch' | 'adjust' | 'filter' | 'restore';
  p: string;
  a?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  q?: 1 | 2 | 3 | 4;
  tab?: 'retouch' | 'adjust' | 'filters';
};

export type RemixPayload = RemixIdPayload | RemixPromptPayload;

const MAX_PROMPT_CHARS = 500;
const MAX_ID_CHARS = 64;
/** Soft cap on encoded base64url length (hash-friendly). */
const MAX_ENCODED_CHARS = 1500;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FEATURES = new Set(['generate', 'retouch', 'adjust', 'filter', 'restore'] as const);
const ASPECTS = new Set(['1:1', '3:4', '4:3', '16:9', '9:16'] as const);
const QUALITIES = new Set([1, 2, 3, 4] as const);
const TABS = new Set(['retouch', 'adjust', 'filters'] as const);

/** Keys that must never appear in a remix payload (image data / URLs). */
const FORBIDDEN_KEYS = new Set([
  'image',
  'photo',
  'dataUrl',
  'dataURL',
  'src',
  'url',
  'img',
  'before',
  'result',
]);

const ID_KEYS = new Set(['v', 'id']);
const PROMPT_KEYS = new Set(['v', 'f', 'p', 'a', 'q', 'tab']);

function assertNoForbiddenKeys(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`Remix payload must not include "${key}"`);
    }
  }
}

function stripControlChars(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, '');
}

function looksLikeImageRef(s: string): boolean {
  const t = s.trim().toLowerCase();
  if (t.startsWith('data:')) return true;
  if (/^https?:\/\//i.test(t) && /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(t)) return true;
  if (/^https?:\/\/.*\b(image|img|photo|avatar)\b/i.test(t)) return true;
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAllowedKeys(obj: Record<string, unknown>, allowed: Set<string>): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown remix payload field: "${key}"`);
    }
  }
}

function validateId(id: unknown): string {
  if (typeof id !== 'string') throw new Error('Remix id must be a string');
  if (id.length === 0 || id.length > MAX_ID_CHARS) {
    throw new Error(`Remix id must be 1–${MAX_ID_CHARS} characters`);
  }
  if (!ID_PATTERN.test(id)) {
    throw new Error('Remix id must be kebab-case alphanumeric');
  }
  return id;
}

function validatePrompt(p: unknown): string {
  if (typeof p !== 'string') throw new Error('Remix prompt must be a string');
  const cleaned = stripControlChars(p);
  if (cleaned.length > MAX_PROMPT_CHARS) {
    throw new Error(`Remix prompt exceeds ${MAX_PROMPT_CHARS} characters`);
  }
  if (looksLikeImageRef(cleaned)) {
    throw new Error('Remix prompt must not contain image data or image URLs');
  }
  return cleaned;
}

/**
 * Normalize and validate a payload before encode. Throws on invalid input.
 */
export function normalizeRemixPayload(payload: RemixPayload): RemixPayload {
  if (!isPlainObject(payload)) throw new Error('Remix payload must be an object');
  assertNoForbiddenKeys(payload);

  if (payload.v !== 1) throw new Error('Unsupported remix payload version');

  if ('id' in payload && payload.id !== undefined) {
    assertAllowedKeys(payload, ID_KEYS);
    if ('f' in payload || 'p' in payload) {
      throw new Error('Remix id form cannot include prompt fields');
    }
    return { v: 1, id: validateId(payload.id) };
  }

  assertAllowedKeys(payload, PROMPT_KEYS);
  const raw = payload as RemixPromptPayload;
  if (typeof raw.f !== 'string' || !FEATURES.has(raw.f as RemixPromptPayload['f'])) {
    throw new Error('Invalid remix feature');
  }
  const out: RemixPromptPayload = {
    v: 1,
    f: raw.f,
    p: validatePrompt(raw.p),
  };
  if (raw.a !== undefined) {
    if (!ASPECTS.has(raw.a)) throw new Error('Invalid remix aspect');
    out.a = raw.a;
  }
  if (raw.q !== undefined) {
    if (!QUALITIES.has(raw.q)) throw new Error('Invalid remix quality');
    out.q = raw.q;
  }
  if (raw.tab !== undefined) {
    if (!TABS.has(raw.tab)) throw new Error('Invalid remix tab');
    out.tab = raw.tab;
  }
  return out;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(raw: string): Uint8Array | null {
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + '='.repeat(padLen);
  try {
    const binary =
      typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/**
 * Encode a remix payload to base64url JSON (no padding).
 * Throws if the payload is invalid or the encoded form is too long.
 */
export function encodeRemixPayload(payload: RemixPayload): string {
  const normalized = normalizeRemixPayload(payload);
  const json = JSON.stringify(normalized);
  const bytes = new TextEncoder().encode(json);
  const encoded = bytesToBase64Url(bytes);
  if (encoded.length > MAX_ENCODED_CHARS) {
    throw new Error(`Encoded remix payload exceeds ${MAX_ENCODED_CHARS} characters`);
  }
  return encoded;
}

/**
 * Decode and strictly sanitize a base64url remix payload.
 * Returns null on garbage / invalid shapes (does not throw).
 */
export function decodeRemixPayload(raw: string): RemixPayload | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_ENCODED_CHARS) {
    return null;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) return null;

  const bytes = base64UrlToBytes(raw);
  if (!bytes) return null;

  let parsed: unknown;
  try {
    const json = new TextDecoder().decode(bytes);
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isPlainObject(parsed)) return null;
  for (const key of Object.keys(parsed)) {
    if (FORBIDDEN_KEYS.has(key)) return null;
  }

  try {
    return normalizeRemixPayload(parsed as RemixPayload);
  } catch {
    return null;
  }
}

/**
 * Build a shareable remix URL: `${origin}${basePath}/r#${encoded}`.
 */
export function buildRemixUrl(
  payload: RemixPayload,
  options?: { origin?: string; basePath?: string },
): string {
  const origin = options?.origin ?? SITE_ORIGIN;
  const basePath = options?.basePath ?? SITE_BASE_PATH;
  const encoded = encodeRemixPayload(payload);
  const base = `${origin.replace(/\/$/, '')}${basePath.replace(/\/$/, '')}`;
  return `${base}/r#${encoded}`;
}

/**
 * Parse a location hash (`#...` or raw encoded string) into a remix payload.
 */
export function parseRemixHash(hash: string): RemixPayload | null {
  if (typeof hash !== 'string') return null;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  // Allow accidental query after hash fragment in some navigations
  const fragment = raw.split('?')[0] ?? '';
  if (!fragment) return null;
  return decodeRemixPayload(fragment);
}

export { MAX_PROMPT_CHARS, MAX_ID_CHARS, MAX_ENCODED_CHARS, ID_PATTERN, FORBIDDEN_KEYS };
