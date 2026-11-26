/** @license SPDX-License-Identifier: MIT */
import { test, expect } from '@playwright/test';

test.describe('Homepage first screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'en');
      localStorage.removeItem('bloom_image_provider');
      sessionStorage.removeItem('bloom_api_key');
      sessionStorage.removeItem('bloom_openrouter_api_key');
    });
  });
  test('design modules load without errors and remount after navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/assets/') && response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto('/');
    await expect(page.locator('.home-hero')).toHaveClass(/is-entered/);
    await expect(page.locator('[data-moment="liquid-hover"]')).toHaveAttribute(
      'data-moment-mounted',
      '1',
    );
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    await page.getByRole('button', { name: 'All photo tools', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'All photo tools', exact: true })
      .getByRole('link', { name: 'Generate Image', exact: true })
      .click();
    await page.goBack();
    await expect(page.locator('[data-moment="liquid-hover"]')).toHaveAttribute(
      'data-moment-mounted',
      '1',
    );
    expect(errors).toEqual([]);
  });
  for (const [width, height] of [
    [320, 640],
    [320, 844],
    [390, 667],
    [390, 844],
    [768, 1024],
    [820, 1180],
    [1024, 900],
    [1440, 900],
  ]) {
    test(`primary actions lead and comparison stays reachable at ${width}×${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const hero = page.locator('#top');
      const upload = hero.getByRole('button', { name: 'Upload a photo' });
      await expect(upload).toBeInViewport({ ratio: 1 });
      await expect(page.getByTestId('try-demo-button')).toBeInViewport({ ratio: 1 });
      const comparison = hero.getByRole('slider');
      if (height < 760) await comparison.scrollIntoViewIfNeeded();
      await expect(comparison).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.getByTestId('sticky-demo-cta')).toHaveCount(0);
    });
  }
  test('mobile tool menu opens, closes with Escape and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menu = page.locator('button[aria-label="All photo tools"]');
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'All photo tools', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'All photo tools', exact: true })).toHaveCount(0);
    await expect(menu).toBeFocused();
    await expect(menu).toHaveCSS('outline-style', 'solid');
    await expect(menu).toHaveCSS('outline-width', '2px');
  });
  test('comparison supports keyboard and demo opens an editor sample', async ({ page }) => {
    await page.goto('/');
    const slider = page.locator('#top').getByRole('slider');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '52');
    await page.getByTestId('try-demo-button').click();
    await expect(page.getByTestId('api-key-notice')).toHaveCount(0);
    await page
      .locator('#top')
      .getByRole('button', { name: 'Open editor with sample photo' })
      .click();
    await expect(page).toHaveURL(/\/edit$/);
    await expect(page.getByRole('button', { name: 'Retouch', exact: true })).toBeVisible();
  });
});
