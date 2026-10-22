/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wave Q — mobile first-viewport showcase + sticky demo CTA + tab scroll cues.
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Wave Q — mobile first screen', () => {
  test.use({ ...devices['iPhone 12'] });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pixshop_language', 'zh-TW');
      localStorage.removeItem('pixshop_image_provider');
      sessionStorage.removeItem('pixshop_api_key');
      sessionStorage.removeItem('pixshop_openrouter_api_key');
    });
  });

  test('shows hero before/after showcase and sticky try-demo CTA', async ({ page }) => {
    await page.goto('/');
    const hero = page.getByTestId('mobile-hero-showcase');
    await expect(hero).toBeVisible();
    await expect(page.getByText(/先看看能做出什麼|See what you can make/)).toBeVisible();
    await expect(page.getByRole('slider')).toBeVisible();

    const sticky = page.getByTestId('sticky-demo-cta');
    await expect(sticky).toBeVisible();
    await expect(page.getByTestId('sticky-try-demo-button')).toHaveText(/免金鑰試玩|Try demo/);

    await page.getByTestId('sticky-try-demo-button').click();
    await expect(page.getByTestId('sticky-demo-cta')).toHaveCount(0);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('pixshop_image_provider')))
      .toBe('demo');
  });

  test('tab strip exposes scroll-right cue when overflow exists', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByTestId('start-tab-nav');
    await expect(nav).toBeVisible();
    // On a phone-width viewport the strip overflows; right fade/arrow should appear.
    await expect(
      page.getByTestId('tab-fade-right').or(page.getByTestId('tab-scroll-right')),
    ).toBeVisible();
  });
});

test.describe('Wave Q — desktop unchanged', () => {
  test('hero showcase stays mobile-only at 1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('pixshop_language', 'en');
      localStorage.removeItem('pixshop_image_provider');
      sessionStorage.removeItem('pixshop_api_key');
    });
    await page.goto('/');
    await expect(page.getByTestId('mobile-hero-showcase')).toHaveCount(0);
    await expect(page.getByTestId('sticky-demo-cta')).toHaveCount(0);
  });
});
