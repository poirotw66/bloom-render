/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave Y — multi-style collage + multi-person synthesis (demo mode).
 */

import { test, expect } from '@playwright/test';

test.describe('Wave Y — style collage + multi-person', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
  });

  test('landing collage select mode and multi-person entry', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('viral-templates')).toBeVisible();
    await expect(page.getByTestId('viral-collage-mode')).toBeVisible();
    await expect(page.getByTestId('viral-open-multi-person')).toBeVisible();

    await page.getByTestId('viral-collage-mode').click();
    // First desktop “All” preview only shows 8; stick to early pack ids.
    for (const id of ['figurine-box', 'polaroid-frame', 'era-70s-taiwan', 'taiwan-night-market']) {
      await expect(page.getByTestId(`viral-collage-toggle-${id}`)).toBeVisible();
      await page.getByTestId(`viral-collage-toggle-${id}`).click();
    }
    await expect(page.getByTestId('viral-collage-start')).toBeEnabled();
    await page.getByTestId('viral-collage-start').click();
    await expect(page).toHaveURL(/\/style-collage/);
    await expect(page.getByTestId('style-collage-page')).toBeVisible();
    await expect(page.getByTestId('style-collage-count')).toContainText('4');
  });

  test('style collage generates labeled collage in demo mode', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/style-collage');
    await expect(page.getByTestId('style-collage-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /拼圖/ })).toBeVisible();

    for (const id of ['figurine-box', 'polaroid-frame', 'taiwan-101', 'yearbook-90s']) {
      await page.getByTestId(`style-collage-toggle-${id}`).click();
    }
    await expect(page.getByTestId('style-collage-generate')).toBeEnabled();
    await page.getByTestId('style-collage-generate').click();
    await expect(page.getByTestId('style-collage-result')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('style-collage-slots')).toBeVisible();
    await expect(page.getByTestId('style-collage-demo-label-figurine-box')).toBeVisible();
    await expect(page.getByTestId('style-collage-result-demo-label')).toHaveText('示範圖');
  });

  test('multi-person page loads uploads and templates in demo mode', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/multi-person');
    await expect(page.getByTestId('multi-person-page')).toBeVisible();
    await expect(page.getByTestId('multi-person-upload')).toBeVisible();
    await expect(page.getByTestId('multi-person-templates')).toBeVisible();
    await expect(page.getByTestId('multi-person-template-couple-portrait')).toBeVisible();
    await expect(page.getByTestId('multi-person-generate')).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId('multi-person-generate').click();
    await expect(page.getByTestId('multi-person-result')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('multi-person-result-demo-label')).toHaveText('示範圖');
  });
});
