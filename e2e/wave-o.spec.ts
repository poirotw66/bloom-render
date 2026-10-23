/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave O — viral templates + remix deep-link prefill.
 */

import { test, expect } from '@playwright/test';

/** base64url of {"v":1,"id":"figurine-box"} */
const FIGURINE_HASH = btoa(JSON.stringify({ v: 1, id: 'figurine-box' }))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

test.describe('Wave O — viral templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
  });

  test('landing shows viral template picker with zh-TW labels', async ({ page }) => {
    await page.goto('/');
    const section = page.getByTestId('viral-templates');
    await expect(section).toBeVisible();
    await expect(page.getByRole('heading', { name: '一鍵玩法' })).toBeVisible();
    await expect(page.getByText('公仔盒玩').first()).toBeVisible();
    await expect(page.getByText('拍立得').first()).toBeVisible();
    await expect(page.getByTestId('viral-apply-figurine-box')).toBeVisible();
    // Wave U/V categories + samples (horizontal scroll / filter chips).
    await expect(page.getByRole('button', { name: '玩具公仔' })).toBeVisible();
    await expect(page.getByRole('button', { name: '服裝角色' })).toBeVisible();
    await page.getByRole('button', { name: '服裝角色' }).click();
    await expect(page.getByTestId('viral-apply-yukata-festival')).toBeVisible();
    await expect(page.getByText('日系浴衣祭典').first()).toBeVisible();
  });

  test('generate page shows compact viral section', async ({ page }) => {
    await page.goto('/generate');
    await expect(page.getByTestId('viral-templates')).toBeVisible();
  });
});

test.describe('Wave O — remix deep link prefill', () => {
  test('opening /r#id in demo mode prefills editor retouch prompt', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'en');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
    await page.goto(`/r#${FIGURINE_HASH}`);
    await expect(page).toHaveURL(/\/edit/);
    const prompt = page.locator('form input[type="text"]').first();
    await expect(prompt).toBeVisible({ timeout: 15000 });
    await expect(prompt).toHaveValue(/collectible 1\/7 scale PVC figure/i);
  });

  test('invalid remix hash shows error and home CTA', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'en');
    });
    await page.goto('/r#not-a-valid-payload');
    await expect(page.getByText(/invalid or expired/i)).toBeVisible();
    await page.getByRole('button', { name: /Back to home/i }).click();
    await expect(page).toHaveURL(/\/?$/);
  });
});
