/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave Z — new viral categories, collage layout, favorites (demo).
 */

import { test, expect } from '@playwright/test';

test.describe('Wave Z — viral polish', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
  });

  test('landing shows holiday/pet chips and favorites shelf', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('viral-templates')).toBeVisible();
    await expect(page.getByRole('button', { name: '節慶' })).toBeVisible();
    await expect(page.getByRole('button', { name: '寵物' })).toBeVisible();
    await page.getByRole('button', { name: '節慶' }).click();
    await expect(page.getByTestId('viral-apply-christmas-cozy')).toBeVisible();
    await page.getByRole('button', { name: '寵物' }).click();
    await expect(page.getByTestId('viral-apply-pet-royal')).toBeVisible();
    await expect(page.getByTestId('viral-shelves')).toBeVisible();
    await page.getByTestId('viral-favorite-pet-royal').click();
    await page.getByTestId('viral-shelf-favorites').click();
    await expect(page.getByTestId('viral-apply-pet-royal')).toBeVisible();
  });

  test('style-collage exposes layout options', async ({ page }) => {
    await page.goto('/style-collage');
    await expect(page.getByTestId('style-collage-layout')).toBeVisible();
    await expect(page.getByTestId('style-collage-layout-banner')).toBeVisible();
    await expect(page.getByTestId('style-collage-layout-story')).toBeVisible();
    await page.getByTestId('style-collage-layout-banner').click();
    await expect(page.getByTestId('style-collage-layout-banner')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('multi-person lists Wave Z scene templates', async ({ page }) => {
    await page.goto('/multi-person');
    await expect(page.getByTestId('multi-person-template-graduation-group')).toBeVisible();
    await expect(page.getByTestId('multi-person-template-christmas-party')).toBeVisible();
  });
});
