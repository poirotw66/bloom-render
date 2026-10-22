/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Fast Chromium smoke: home, every primary route, demo/no-key, upload → editor.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

const ROUTES: { path: string; expectText: RegExp | string }[] = [
  { path: '/', expectText: /AI-Powered Photo Editor/i },
  { path: '/generate', expectText: /Generate Image|Text to image|Describe/i },
  { path: '/history', expectText: /Generation History/i },
  { path: '/idphoto', expectText: /ID Photo Studio/i },
  { path: '/idphoto/batch', expectText: /ID Photo|Batch/i },
  { path: '/portrait', expectText: /Portrait Retouch/i },
  { path: '/travel', expectText: /AI Travel Photo/i },
  { path: '/themed', expectText: /Themed Photoshoot/i },
  { path: '/couple-group', expectText: /Couple & Group/i },
  { path: '/try-on', expectText: /Try-On/i },
  { path: '/enhance', expectText: /Local Enhance/i },
  { path: '/photography-service', expectText: /Photography/i },
  { path: '/prompt-gallery', expectText: /Prompt gallery/i },
];

test.describe('smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('BloomRender').first()).toBeVisible();
    await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
  });

  test('landing shows API-key notice and Try demo with no key', async ({ page }) => {
    // Fresh visitor: no session/local keys, not in demo mode.
    await page.addInitScript(() => {
      try {
        sessionStorage.removeItem('pixshop_api_key');
        sessionStorage.removeItem('pixshop_openrouter_api_key');
        localStorage.removeItem('pixshop_api_key');
        localStorage.removeItem('pixshop_openrouter_api_key');
        localStorage.removeItem('pixshop_image_provider');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/');
    const notice = page.getByTestId('api-key-notice');
    await expect(notice).toBeVisible();
    await expect(notice.getByText(/Add an API key/i)).toBeVisible();
    const tryDemo = page.getByTestId('try-demo-button');
    await expect(tryDemo).toBeVisible();
    await tryDemo.click();
    await expect(page.getByTestId('api-key-notice')).toHaveCount(0);
    await expect(page.getByText(/Demo|Showing a pre-made sample/i).first()).toBeVisible();
  });

  for (const route of ROUTES) {
    test(`route ${route.path} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByText(route.expectText).first()).toBeVisible();
    });
  }

  test('demo / no-key path enables offline demo mode', async ({ page }) => {
    await page.goto('/idphoto');
    const tryDemo = page.getByRole('button', { name: 'Try demo' });
    await expect(tryDemo).toBeVisible();
    await tryDemo.click();
    await expect(page.getByText(/Showing a pre-made sample result|Demo/i).first()).toBeVisible();
    // Notice should disappear once demo mode is on.
    await expect(page.getByRole('button', { name: 'Try demo' })).toHaveCount(0);
  });

  test('upload flow opens the editor', async ({ page }) => {
    await page.goto('/');
    const fileInput = page.locator('#image-upload-start');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await expect(page).toHaveURL(/\/edit$/);
    await expect(page.getByRole('button', { name: 'Retouch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
  });
});
