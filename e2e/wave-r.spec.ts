/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave R — old photo restoration (demo path + remix prefill).
 */

import { test, expect } from '@playwright/test';

test.describe('Wave R — restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
  });

  test('feature page loads with options and demo sample', async ({ page }) => {
    await page.goto('/restore');
    await expect(page.getByTestId('restore-page')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: /老照片修復|Old Photo/ }),
    ).toBeVisible();
    await expect(page.getByTestId('restore-colorize-on')).toBeVisible();
    await expect(page.getByTestId('restore-upscale-toggle')).toBeVisible();
    // Demo mode auto-loads matching sample input (preview + generate).
    await expect(page.getByText(/範例|Sample/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /開始修復|Restore photo/i }).click();
    await expect(page.getByTestId('use-this-style')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('slider')).toBeVisible();
  });

  test('remix deep link prefills colorize off', async ({ page }) => {
    const payload = btoa(JSON.stringify({ v: 1, f: 'restore', p: 'restore-only' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await page.goto(`/r#${payload}`);
    await expect(page).toHaveURL(/\/restore/);
    await expect(page.getByTestId('restore-colorize-off')).toHaveAttribute('aria-pressed', 'true');
  });
});
