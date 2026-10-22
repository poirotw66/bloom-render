/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * OpenRouter OAuth PKCE (fully client-side). Docs:
 * https://openrouter.ai/docs/guides/overview/auth/oauth
 */

export const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth';
export const OPENROUTER_KEYS_EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';

export const STORAGE_KEY_OR_OAUTH_VERIFIER = 'bloom_or_oauth_verifier';
export const STORAGE_KEY_OR_OAUTH_STATE = 'bloom_or_oauth_state';

export const OPENROUTER_OAUTH_CALLBACK_PATH = '/oauth/openrouter';
export const OPENROUTER_KEY_LABEL = 'BloomRender';

export type PkceChallengeMethod = 'S256';

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: PkceChallengeMethod;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Random URL-safe verifier (43–128 chars per RFC 7636). */
export function generateCodeVerifier(byteLength = 32): string {
  if (byteLength < 32 || byteLength > 96) {
    throw new Error('PKCE verifier byte length must be 32–96');
  }
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return bytesToBase64Url(bytes);
}

export async function createS256CodeChallenge(codeVerifier: string): Promise<string> {
  if (!codeVerifier || codeVerifier.length < 43) {
    throw new Error('Invalid PKCE code_verifier');
  }
  const data = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64Url(new Uint8Array(hash));
}

export async function createPkcePair(): Promise<PkcePair> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await createS256CodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}

export function generateOAuthState(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

/** Persist PKCE verifier + CSRF state for the redirect round-trip. */
export function storeOAuthSession(session: { codeVerifier: string; state: string }): void {
  sessionStorage.setItem(STORAGE_KEY_OR_OAUTH_VERIFIER, session.codeVerifier);
  sessionStorage.setItem(STORAGE_KEY_OR_OAUTH_STATE, session.state);
}

export function peekOAuthSession(): { codeVerifier: string; state: string } | null {
  const codeVerifier = sessionStorage.getItem(STORAGE_KEY_OR_OAUTH_VERIFIER);
  const state = sessionStorage.getItem(STORAGE_KEY_OR_OAUTH_STATE);
  if (!codeVerifier || !state) return null;
  return { codeVerifier, state };
}

export function clearOAuthSession(): void {
  sessionStorage.removeItem(STORAGE_KEY_OR_OAUTH_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEY_OR_OAUTH_STATE);
}

/**
 * Absolute callback URL on the current origin + Vite base path.
 * Production GitHub Pages: https://www.bloss0m.com/bloom-render/oauth/openrouter
 */
export function buildOAuthCallbackUrl(options?: { origin?: string; basePath?: string }): string {
  const origin = (
    options?.origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
  const rawBase =
    options?.basePath ??
    (typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/') ??
    '/';
  const base = rawBase === '/' ? '' : rawBase.replace(/\/$/, '');
  return `${origin}${base}${OPENROUTER_OAUTH_CALLBACK_PATH}`;
}

export function buildOpenRouterAuthUrl(options: {
  codeChallenge: string;
  state: string;
  callbackUrl: string;
  keyLabel?: string;
}): string {
  const params = new URLSearchParams({
    callback_url: options.callbackUrl,
    code_challenge: options.codeChallenge,
    code_challenge_method: 'S256',
    state: options.state,
    key_label: options.keyLabel ?? OPENROUTER_KEY_LABEL,
  });
  return `${OPENROUTER_AUTH_URL}?${params.toString()}`;
}

/**
 * Start the browser redirect to OpenRouter. Returns the auth URL
 * (useful for tests); assignment is injectable.
 */
export async function beginOpenRouterOAuth(options?: {
  assign?: (url: string) => void;
  origin?: string;
  basePath?: string;
}): Promise<string> {
  const pkce = await createPkcePair();
  const state = generateOAuthState();
  storeOAuthSession({ codeVerifier: pkce.codeVerifier, state });
  const callbackUrl = buildOAuthCallbackUrl({
    origin: options?.origin,
    basePath: options?.basePath,
  });
  const authUrl = buildOpenRouterAuthUrl({
    codeChallenge: pkce.codeChallenge,
    state,
    callbackUrl,
  });
  const testAssign =
    typeof window !== 'undefined'
      ? (window as unknown as { __BLOOM_OAUTH_ASSIGN__?: (url: string) => void })
          .__BLOOM_OAUTH_ASSIGN__
      : undefined;
  const assign =
    options?.assign ??
    testAssign ??
    ((url: string) => {
      window.location.assign(url);
    });
  assign(authUrl);
  return authUrl;
}

export type ExchangeResult =
  | { ok: true; key: string }
  | {
      ok: false;
      error: 'missing_code' | 'state_mismatch' | 'missing_verifier' | 'exchange_failed' | 'denied';
      message: string;
    };

export function parseOAuthCallbackSearch(search: string): {
  code: string | null;
  state: string | null;
  error: string | null;
} {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
  };
}

/**
 * Validate callback query + session, exchange code for API key, clear verifier.
 */
export async function completeOpenRouterOAuth(
  search: string,
  options?: { fetchImpl?: typeof fetch },
): Promise<ExchangeResult> {
  const { code, state, error } = parseOAuthCallbackSearch(search);
  const session = peekOAuthSession();

  if (error) {
    clearOAuthSession();
    return { ok: false, error: 'denied', message: error };
  }
  if (!code) {
    clearOAuthSession();
    return { ok: false, error: 'missing_code', message: 'missing_code' };
  }
  if (!session) {
    return { ok: false, error: 'missing_verifier', message: 'missing_verifier' };
  }
  if (!state || state !== session.state) {
    clearOAuthSession();
    return { ok: false, error: 'state_mismatch', message: 'state_mismatch' };
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(OPENROUTER_KEYS_EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: session.codeVerifier,
        code_challenge_method: 'S256',
      }),
    });
    if (!response.ok) {
      clearOAuthSession();
      return {
        ok: false,
        error: 'exchange_failed',
        message: `http_${response.status}`,
      };
    }
    const data = (await response.json()) as { key?: unknown };
    if (typeof data.key !== 'string' || !data.key.trim()) {
      clearOAuthSession();
      return { ok: false, error: 'exchange_failed', message: 'empty_key' };
    }
    clearOAuthSession();
    return { ok: true, key: data.key.trim() };
  } catch {
    clearOAuthSession();
    return { ok: false, error: 'exchange_failed', message: 'network' };
  }
}
