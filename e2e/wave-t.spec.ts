/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave T — remember-key toggle, CSP meta, bloom_ storage keys.
 */

import { test, expect } from '@playwright/test';

test.describe('Wave T — key handling + CSP', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.removeItem('bloom_image_provider');
      localStorage.removeItem('bloom_remember_api_key');
      sessionStorage.removeItem('bloom_api_key');
      sessionStorage.removeItem('bloom_openrouter_api_key');
    });
  });

  test('settings shows remember-key toggle (zh-TW) and persists opt-in', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: '設定' }).click();
    const remember = page.getByTestId('remember-api-key');
    await expect(remember).toBeVisible();
    await expect(page.getByText('在此裝置記住金鑰')).toBeVisible();
    await expect(remember).not.toBeChecked();

    await remember.check();
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('bloom_remember_api_key')))
      .toBe('true');

    await page.getByLabel('API 金鑰').fill('AIza-e2e-remember');
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            sessionStorage.getItem('bloom_api_key') === 'AIza-e2e-remember' &&
            localStorage.getItem('bloom_api_key') === 'AIza-e2e-remember',
        ),
      )
      .toBe(true);

    await remember.uncheck();
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            localStorage.getItem('bloom_remember_api_key') === 'false' &&
            localStorage.getItem('bloom_api_key') === null &&
            sessionStorage.getItem('bloom_api_key') === 'AIza-e2e-remember',
        ),
      )
      .toBe(true);
  });

  test('index.html serves CSP meta without Google Fonts', async ({ page }) => {
    await page.goto('/');
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain('https://generativelanguage.googleapis.com');
    expect(csp).toContain('https://openrouter.ai');
    expect(csp).toContain('https://huggingface.co');
    expect(csp).toContain('https://cdn.jsdelivr.net');
    await expect(page.locator('link[href*="fonts.googleapis.com"]')).toHaveCount(0);
  });

  test('demo mode still works under CSP', async ({ page }) => {
    await page.goto('/');
    const tryDemo = page.getByTestId('try-demo-button');
    await expect(tryDemo).toBeVisible();
    await tryDemo.click();
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('bloom_image_provider')))
      .toBe('demo');
  });

  test('migrates legacy pixshop_ keys once', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('pixshop_language', 'en');
      localStorage.setItem('pixshop_theme', 'night');
      sessionStorage.setItem('pixshop_api_key', 'AIza-migrated');
    });
    await page.goto('/');
    const migrated = await page.evaluate(() => ({
      lang: localStorage.getItem('bloom_language'),
      theme: localStorage.getItem('bloom_theme'),
      key: sessionStorage.getItem('bloom_api_key'),
      legacyLang: localStorage.getItem('pixshop_language'),
      legacyKey: sessionStorage.getItem('pixshop_api_key'),
    }));
    expect(migrated.lang).toBe('en');
    expect(migrated.theme).toBe('night');
    expect(migrated.key).toBe('AIza-migrated');
    expect(migrated.legacyLang).toBeNull();
    expect(migrated.legacyKey).toBeNull();
  });
});
