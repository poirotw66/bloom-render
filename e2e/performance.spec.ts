/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
  });
});

test('home loads only the active locale and defers generation and closed dialogs', async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByTestId('viral-templates')).toBeVisible();
  expect(scripts.some((url) => /locale-en-/.test(url))).toBe(true);
  expect(
    scripts.some((url) =>
      /locale-zh-TW-|GenerateStartScreen-|SettingsModal-|HistoryPanel-|gemini-sdk-|transformers-|image-archive-|image-crop-|share-qr-/.test(
        url,
      ),
    ),
  ).toBe(false);
  await page.getByRole('link', { name: 'Generate Image', exact: true }).click();
  await expect(page.getByTestId('generate-prompt')).toBeVisible();
  expect(scripts.some((url) => /GenerateStartScreen-/.test(url))).toBe(true);
});

test('a failed initial locale download shows a retry and recovers', async ({ page }) => {
  let attempts = 0;
  await page.route('**/locale-en-*.js', async (route) => {
    if (++attempts === 1) await route.abort();
    else await route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Unable to load language');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
});

test('a failed locale switch leaves the active UI usable and recovers on retry', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/locale-zh-TW-*.js', async (route) => {
    if (++attempts === 1) await route.abort();
    else await route.continue();
  });
  await page.goto('/');
  await page.getByTestId('lang-toggle-zh').click();
  await expect(page.getByRole('alert')).toContainText('Unable to load language');
  await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
});

test('the visited locale remains usable when its module is unavailable on reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const names = await caches.keys();
        const name = names.find((key) => key.startsWith('bloomrender-locale-messages:'));
        return name ? (await (await caches.open(name)).keys()).length : 0;
      }),
    )
    .toBeGreaterThan(0);
  let blocked = 0;
  await page.route('**/locale-en-*.js', async (route) => {
    blocked++;
    await route.abort();
  });
  await page.reload();
  await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
  expect(blocked).toBeGreaterThan(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a delayed settings dialog keeps focus trapped and supports Escape', async ({ page }) => {
  let finishDownload!: () => void;
  const download = new Promise<void>((resolve) => {
    finishDownload = resolve;
  });
  await page.route('**/SettingsModal-*.js', async (route) => {
    await download;
    await route.continue();
  });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Settings', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  const response = page.waitForResponse((response) => /SettingsModal-/.test(response.url()));
  finishDownload();
  await response;
});
