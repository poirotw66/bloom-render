/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

test.describe('Wave N — i18n + star nudge', () => {
  test('中/EN toggle persists language in localStorage', async ({ page }) => {
    // Seed once; addInitScript re-runs on reload so use a guard.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('wave_n_lang_seeded')) {
        localStorage.setItem('pixshop_language', 'en');
        sessionStorage.setItem('wave_n_lang_seeded', '1');
      }
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByTestId('lang-toggle-zh').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('pixshop_language')))
      .toBe('zh-TW');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
    await expect(page.getByText('證件照').first()).toBeVisible();
  });

  test('zh-* browser language defaults to zh-TW when unset', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'zh-TW' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.removeItem('pixshop_language');
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
    await context.close();
  });

  test('star nudge shows once after first success and stays dismissed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pixshop_language', 'zh-TW');
      localStorage.setItem('pixshop_image_provider', 'demo');
      localStorage.removeItem('pixshop_star_nudge_dismissed');
    });
    await page.goto('/idphoto');
    await page.getByRole('button', { name: /Generate ID Photo|生成證件照/i }).click();
    await expect(page.getByTestId('star-nudge')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/喜歡就給顆星/)).toBeVisible();
    await page.getByRole('button', { name: /關閉|Dismiss/i }).click();
    await expect(page.getByTestId('star-nudge')).toHaveCount(0);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('pixshop_star_nudge_dismissed')))
      .toBe('1');
    // Second demo generate must not show the nudge again.
    await page.getByRole('button', { name: /再生成一張|Generate Another/i }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('star-nudge')).toHaveCount(0);
  });
});

test.describe('Wave N — route HTML build output', () => {
  test('dist emits per-route index.html with 200-capable paths', async () => {
    const dist = path.resolve('dist');
    test.skip(!existsSync(path.join(dist, 'index.html')), 'run npm run build first');
    const routes = [
      'generate',
      'idphoto',
      'idphoto/batch',
      'travel',
      'try-on',
      'photography-service',
      'enhance',
      'restore',
      'prompt-gallery',
      'r',
      'oauth/openrouter',
    ];
    for (const route of routes) {
      const file = path.join(dist, route, 'index.html');
      expect(existsSync(file), file).toBe(true);
      const html = readFileSync(file, 'utf8');
      expect(html).toMatch(/<title>[^<]+<\/title>/);
      expect(html).toContain('og:title');
      expect(html).toContain('rel="canonical"');
    }
    expect(existsSync(path.join(dist, 'robots.txt'))).toBe(true);
    expect(existsSync(path.join(dist, 'sitemap.xml'))).toBe(true);
    expect(existsSync(path.join(dist, '404.html'))).toBe(true);
  });
});
