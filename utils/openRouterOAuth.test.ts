/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  beginOpenRouterOAuth,
  buildOAuthCallbackUrl,
  buildOpenRouterAuthUrl,
  clearOAuthSession,
  completeOpenRouterOAuth,
  createPkcePair,
  createS256CodeChallenge,
  generateCodeVerifier,
  OPENROUTER_AUTH_URL,
  OPENROUTER_KEYS_EXCHANGE_URL,
  OPENROUTER_OAUTH_CALLBACK_PATH,
  parseOAuthCallbackSearch,
  peekOAuthSession,
  STORAGE_KEY_OR_OAUTH_STATE,
  STORAGE_KEY_OR_OAUTH_VERIFIER,
  storeOAuthSession,
} from './openRouterOAuth';

afterEach(() => {
  clearOAuthSession();
  vi.restoreAllMocks();
});

describe('openRouterOAuth PKCE', () => {
  it('generates verifier and S256 challenge (roundtrip shape)', async () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    const challenge = await createS256CodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toContain('=');
    expect(challenge).not.toEqual(verifier);

    const pair = await createPkcePair();
    expect(pair.codeChallengeMethod).toBe('S256');
    expect(await createS256CodeChallenge(pair.codeVerifier)).toBe(pair.codeChallenge);
  });

  it('builds callback URL on /bloom-render base path', () => {
    expect(
      buildOAuthCallbackUrl({ origin: 'https://www.bloss0m.com', basePath: '/bloom-render/' }),
    ).toBe(`https://www.bloss0m.com/bloom-render${OPENROUTER_OAUTH_CALLBACK_PATH}`);
    expect(buildOAuthCallbackUrl({ origin: 'http://127.0.0.1:4173', basePath: '/' })).toBe(
      `http://127.0.0.1:4173${OPENROUTER_OAUTH_CALLBACK_PATH}`,
    );
  });

  it('builds OpenRouter auth URL with S256 + state', () => {
    const url = buildOpenRouterAuthUrl({
      codeChallenge: 'abc',
      state: 'xyz',
      callbackUrl: 'https://www.bloss0m.com/bloom-render/oauth/openrouter',
    });
    expect(url.startsWith(`${OPENROUTER_AUTH_URL}?`)).toBe(true);
    const u = new URL(url);
    expect(u.searchParams.get('code_challenge')).toBe('abc');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(u.searchParams.get('state')).toBe('xyz');
    expect(u.searchParams.get('callback_url')).toContain('/bloom-render/oauth/openrouter');
    expect(u.searchParams.get('key_label')).toBe('BloomRender');
  });

  it('beginOpenRouterOAuth stores session and redirects', async () => {
    const assign = vi.fn();
    const url = await beginOpenRouterOAuth({
      assign,
      origin: 'https://www.bloss0m.com',
      basePath: '/bloom-render/',
    });
    expect(assign).toHaveBeenCalledWith(url);
    expect(url).toContain('openrouter.ai/auth');
    const session = peekOAuthSession();
    expect(session?.codeVerifier).toBeTruthy();
    expect(session?.state).toBeTruthy();
    const u = new URL(url);
    expect(u.searchParams.get('state')).toBe(session!.state);
  });
});

describe('openRouterOAuth callback', () => {
  it('parses query params', () => {
    expect(parseOAuthCallbackSearch('?code=c1&state=s1')).toEqual({
      code: 'c1',
      state: 's1',
      error: null,
    });
    expect(parseOAuthCallbackSearch('error=access_denied')).toEqual({
      code: null,
      state: null,
      error: 'access_denied',
    });
  });

  it('exchanges code with mocked fetch and clears verifier', async () => {
    storeOAuthSession({ codeVerifier: 'v'.repeat(43), state: 'st' });
    const fetchImpl = vi.fn(async () =>
      Response.json({ key: ' sk-or-v1-test ' }),
    ) as unknown as typeof fetch;

    const result = await completeOpenRouterOAuth('?code=authcode&state=st', { fetchImpl });
    expect(result).toEqual({ ok: true, key: 'sk-or-v1-test' });
    expect(fetchImpl).toHaveBeenCalledWith(
      OPENROUTER_KEYS_EXCHANGE_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          code: 'authcode',
          code_verifier: 'v'.repeat(43),
          code_challenge_method: 'S256',
        }),
      }),
    );
    expect(sessionStorage.getItem(STORAGE_KEY_OR_OAUTH_VERIFIER)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY_OR_OAUTH_STATE)).toBeNull();
  });

  it('rejects state mismatch and clears session', async () => {
    storeOAuthSession({ codeVerifier: 'v'.repeat(43), state: 'expected' });
    const result = await completeOpenRouterOAuth('?code=c&state=wrong');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('state_mismatch');
    expect(peekOAuthSession()).toBeNull();
  });

  it('handles denied / missing code / exchange failure', async () => {
    storeOAuthSession({ codeVerifier: 'v'.repeat(43), state: 'st' });
    const denied = await completeOpenRouterOAuth('?error=access_denied&state=st');
    expect(denied).toMatchObject({ ok: false, error: 'denied' });

    storeOAuthSession({ codeVerifier: 'v'.repeat(43), state: 'st' });
    const missing = await completeOpenRouterOAuth('?state=st');
    expect(missing).toMatchObject({ ok: false, error: 'missing_code' });

    storeOAuthSession({ codeVerifier: 'v'.repeat(43), state: 'st' });
    const fetchFail = vi.fn(
      async () => new Response('nope', { status: 403 }),
    ) as unknown as typeof fetch;
    const failed = await completeOpenRouterOAuth('?code=c&state=st', { fetchImpl: fetchFail });
    expect(failed).toMatchObject({ ok: false, error: 'exchange_failed' });
    expect(peekOAuthSession()).toBeNull();
  });
});
