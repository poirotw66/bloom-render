/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave P — OpenRouter OAuth PKCE button + mocked redirect / callback.
 */

import { test, expect } from '@playwright/test';

test.describe('Wave P — OpenRouter OAuth', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.removeItem('bloom_image_provider');
      sessionStorage.removeItem('bloom_api_key');
      sessionStorage.removeItem('bloom_openrouter_api_key');
      sessionStorage.removeItem('bloom_or_oauth_verifier');
      sessionStorage.removeItem('bloom_or_oauth_state');
    });
  });

  test('hero notice shows Sign in with OpenRouter and starts PKCE redirect', async ({ page }) => {
    await page.addInitScript(() => {
      (
        window as unknown as {
          __orAuthUrl?: string;
          __BLOOM_OAUTH_ASSIGN__?: (url: string) => void;
        }
      ).__orAuthUrl = '';
      (
        window as unknown as { __BLOOM_OAUTH_ASSIGN__?: (url: string) => void }
      ).__BLOOM_OAUTH_ASSIGN__ = (url: string) => {
        (window as unknown as { __orAuthUrl?: string }).__orAuthUrl = url;
      };
    });

    await page.goto('/');
    const signIn = page.getByTestId('openrouter-sign-in');
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveText(/用 OpenRouter 登入|Sign in with OpenRouter/);

    await signIn.click();
    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __orAuthUrl?: string }).__orAuthUrl ?? ''),
      )
      .toMatch(/openrouter\.ai\/auth/);

    const authUrl = await page.evaluate(
      () => (window as unknown as { __orAuthUrl?: string }).__orAuthUrl ?? '',
    );
    const u = new URL(authUrl);
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(u.searchParams.get('code_challenge')).toBeTruthy();
    expect(u.searchParams.get('state')).toBeTruthy();
    expect(u.searchParams.get('callback_url')).toMatch(/\/oauth\/openrouter$/);
    expect(u.searchParams.get('key_label')).toBe('BloomRender');

    const session = await page.evaluate(() => ({
      verifier: sessionStorage.getItem('bloom_or_oauth_verifier'),
      state: sessionStorage.getItem('bloom_or_oauth_state'),
    }));
    expect(session.verifier).toBeTruthy();
    expect(session.state).toBe(u.searchParams.get('state'));
  });

  test('callback exchanges code (mocked fetch) and stores OpenRouter key', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('bloom_or_oauth_verifier', 'a'.repeat(43));
      sessionStorage.setItem('bloom_or_oauth_state', 'e2e-state');
    });

    await page.route('https://openrouter.ai/api/v1/auth/keys', async (route) => {
      const body = route.request().postDataJSON() as {
        code?: string;
        code_verifier?: string;
        code_challenge_method?: string;
      };
      expect(body.code).toBe('e2e-code');
      expect(body.code_verifier).toBe('a'.repeat(43));
      expect(body.code_challenge_method).toBe('S256');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ key: 'sk-or-v1-e2e-mock' }),
      });
    });

    await page.goto('/oauth/openrouter?code=e2e-code&state=e2e-state');
    await expect(page).toHaveURL(/\/?$/);
    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('bloom_openrouter_api_key')))
      .toBe('sk-or-v1-e2e-mock');
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('bloom_image_provider')))
      .toBe('openrouter');
    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('bloom_or_oauth_verifier')))
      .toBeNull();
    await expect(page.getByTestId('api-key-notice')).toHaveCount(0);
  });

  test('callback error path shows message when denied', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('bloom_or_oauth_verifier', 'a'.repeat(43));
      sessionStorage.setItem('bloom_or_oauth_state', 'st');
    });
    await page.goto('/oauth/openrouter?error=access_denied');
    await expect(page.getByTestId('openrouter-oauth-error')).toBeVisible();
    await expect(page.getByText(/取消|cancelled/i)).toBeVisible();
  });
});
