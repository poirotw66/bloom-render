/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const SAMPLE_BASE64 = SAMPLE.toString('base64');

async function savedVariations(page: Page): Promise<number[]> {
  return page.evaluate(
    () =>
      new Promise<number[]>((resolve, reject) => {
        const opening = indexedDB.open('bloomrender');
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const request = db.transaction('history').objectStore('history').getAll();
          request.onerror = () => {
            db.close();
            reject(request.error);
          };
          request.onsuccess = () => {
            db.close();
            resolve(request.result.map((row) => row.options.variationIndex).sort());
          };
        };
      }),
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-not-used');
  });
});

test('partial generation keeps successful images and retries only the missing history slot', async ({
  page,
}) => {
  let posts = 0;
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    const slot = posts++;
    await route.fulfill({
      status: slot === 1 ? 400 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        slot === 1
          ? { error: { message: 'Invalid request' } }
          : { data: [{ b64_json: SAMPLE_BASE64, media_type: 'image/png' }] },
      ),
    });
  });
  await page.goto('/generate');
  await page.getByTestId('generate-prompt').fill('A red balloon');
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  await expect(page.getByText('Generated 3 of 4 images')).toBeVisible();
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(3);
  await expect.poll(() => savedVariations(page)).toEqual([0, 2, 3]);
  expect(posts).toBe(4);

  await page.getByRole('button', { name: 'Retry 1 failed' }).click();
  await expect(page.getByText('Generated 3 of 4 images')).toHaveCount(0);
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(4);
  await expect.poll(() => savedVariations(page)).toEqual([0, 1, 2, 3]);
  expect(posts).toBe(5);
});

test('a temporary image download failure retries the download without regenerating', async ({
  page,
}) => {
  let posts = 0;
  let downloads = 0;
  const imageUrl = 'https://openrouter.ai/mock-generated.png';
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    posts++;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ url: imageUrl }] }),
    });
  });
  await page.route(imageUrl, async (route) => {
    downloads++;
    await route.fulfill({
      status: downloads === 1 ? 503 : 200,
      contentType: 'image/png',
      body: downloads === 1 ? 'Temporary download failure' : SAMPLE,
    });
  });
  await page.goto('/generate');
  await page.getByTestId('generate-prompt').fill('A red balloon');
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await expect.poll(() => savedVariations(page)).toEqual([0]);
  expect(posts).toBe(1);
  expect(downloads).toBe(2);
});
