/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const SAMPLE = new URL('./fixtures/sample.png', import.meta.url);
const SAMPLE_BUFFER = readFileSync(SAMPLE);
const SAMPLE_BASE64 = SAMPLE_BUFFER.toString('base64');

async function holdAfterFirstImage(page: Page) {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    const index = requests++;
    if (index > 0) await gate;
    await route
      .fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ b64_json: SAMPLE_BASE64, media_type: 'image/png' }] }),
      })
      // Cancellation can close the request before the held provider response is released.
      .catch((error: Error) => {
        if (!/closed|aborted|disposed|invalid interception/i.test(error.message)) throw error;
      });
  });
  return { count: () => requests, release };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-not-used');
  });
});

test('collage shows a finished slot immediately and cancellation stops the remaining queue', async ({
  page,
}) => {
  const provider = await holdAfterFirstImage(page);
  await page.goto('/style-collage');
  await page.getByTestId('style-collage-file').setInputFiles(SAMPLE.pathname);
  for (const id of ['figurine-box', 'polaroid-frame', 'taiwan-101', 'yearbook-90s']) {
    await page.getByTestId(`style-collage-toggle-${id}`).click();
  }
  await page.getByTestId('style-collage-generate').click();
  // Reference-image preparation can finish out of order before the first POST.
  const finishedImages = page.locator('[data-testid^="style-collage-slot-img-"]');
  await expect(finishedImages).toHaveCount(1);
  const completedSlot = await finishedImages.getAttribute('data-testid');
  await expect(page.getByText('Styles ready: 1 / 4')).toBeVisible();
  await expect.poll(provider.count).toBe(3);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  provider.release();
  await page.waitForLoadState('networkidle');
  expect(provider.count()).toBe(3);
  await expect(finishedImages).toHaveCount(1);
  await expect(page.getByTestId(completedSlot!)).toBeVisible();
  await expect(page.getByTestId('style-collage-result')).toBeVisible();
  const retries = page.locator('[data-testid^="style-collage-retry-"]');
  await expect(retries).toHaveCount(3);
  await expect(retries.first()).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
});

test('batch ID photos forward provider settings and keep completed images after cancellation', async ({
  page,
}) => {
  const provider = await holdAfterFirstImage(page);
  await page.goto('/idphoto/batch');
  await page.locator('#batch-image-upload').setInputFiles(
    Array.from({ length: 5 }, (_, index) => ({
      name: `photo-${index}.png`,
      mimeType: 'image/png',
      buffer: SAMPLE_BUFFER,
    })),
  );
  await page.getByRole('button', { name: 'Generate All (5)', exact: true }).click();
  await expect(page.getByText('1 successful', { exact: true })).toBeVisible();
  await expect.poll(provider.count).toBe(4);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  provider.release();
  await expect(page.getByText('Batch cancelled. Completed images are kept.')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(provider.count()).toBe(4);
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Download.*1/ })).toBeEnabled();
});
