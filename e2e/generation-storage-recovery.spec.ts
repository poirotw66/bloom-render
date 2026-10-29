/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { test, expect, type Page } from '@playwright/test';

const SAMPLE_PATH = new URL('./fixtures/sample.png', import.meta.url);
const PNG = readFileSync(SAMPLE_PATH).toString('base64');

async function seedHistory(page: Page) {
  await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open('bloomrender', 1);
      opening.onupgradeneeded = () =>
        opening.result.createObjectStore('history', { keyPath: 'id' });
      opening.onerror = () => reject(opening.error);
      opening.onsuccess = () => {
        const db = opening.result;
        const tx = db.transaction('history', 'readwrite');
        tx.objectStore('history').put({
          id: 'saved-before-failure',
          type: 'portrait',
          timestamp: 1,
          blob,
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
  }, PNG);
}

async function storedIds(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const opening = indexedDB.open('bloomrender');
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const request = db.transaction('history').objectStore('history').getAllKeys();
          request.onsuccess = () => {
            db.close();
            resolve(request.result.map(String));
          };
          request.onerror = () => {
            db.close();
            reject(request.error);
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

test('history reconnects after a temporary first open failure without reloading', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
  await seedHistory(page);
  await page.evaluate(() => {
    const open = indexedDB.open.bind(indexedDB);
    let failed = false;
    indexedDB.open = (name: string, version?: number) => {
      if (name === 'bloomrender' && !failed) {
        failed = true;
        throw new DOMException('Temporary storage failure', 'UnknownError');
      }
      return version === undefined ? open(name) : open(name, version);
    };
  });
  await page.getByRole('button', { name: 'Generation History', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Generation History', exact: true });
  await expect(dialog.getByTestId('history-storage-notice')).toBeVisible();
  await expect(dialog.getByText(/History storage is unavailable/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Reconnect and retry saves' }).click();
  await expect(dialog.getByTestId('history-storage-notice')).toHaveCount(0);
  await expect(dialog.getByRole('img')).toHaveCount(1);
  expect(await storedIds(page)).toEqual(['saved-before-failure']);
});

test('quota failure retains downloadable images and retries saves without regenerating', async ({
  page,
}) => {
  let generations = 0;
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    generations++;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ b64_json: PNG, media_type: 'image/png' }] }),
    });
  });
  await page.goto('/');
  await expect(page.getByText(/AI-Powered Photo Editor/i)).toBeVisible();
  await seedHistory(page);
  await page.evaluate(() => {
    const state = window as Window & { failHistoryWrites?: boolean };
    state.failHistoryWrites = true;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (this.name === 'history' && state.failHistoryWrites)
        throw new DOMException('Storage full', 'QuotaExceededError');
      return key === undefined ? put.call(this, value) : put.call(this, value, key);
    };
  });
  await page.getByRole('link', { name: 'Generate Image', exact: true }).click();
  await page.getByTestId('generate-prompt').fill('Two red balloons');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  const notice = page.getByRole('main').getByTestId('history-storage-notice');
  await expect(notice.getByText(/Browser storage is full/)).toBeVisible();
  await expect(notice.getByRole('button', { name: 'Download 2 unsaved images' })).toBeVisible();
  expect(await storedIds(page)).toEqual(['saved-before-failure']);
  const downloading = page.waitForEvent('download');
  await notice.getByRole('button', { name: 'Download 2 unsaved images' }).click();
  const download = await downloading;
  const file = await download.path();
  expect(file).toBeTruthy();
  const archive = await JSZip.loadAsync(readFileSync(file!));
  expect(Object.keys(archive.files).sort()).toEqual(['unsaved-image-1.png', 'unsaved-image-2.png']);
  // Downloading is not proof of saving and must not discard the retryable copies.
  await expect(notice.getByRole('button', { name: 'Download 2 unsaved images' })).toBeVisible();
  await page.evaluate(() => {
    (window as Window & { failHistoryWrites?: boolean }).failHistoryWrites = false;
  });
  await notice.getByRole('button', { name: 'Reconnect and retry saves' }).click();
  await expect(notice).toHaveCount(0);
  await expect.poll(async () => (await storedIds(page)).length).toBe(3);
  expect(generations).toBe(2);
});

test('portrait cancel and restart cannot save the late old result', async ({ page }) => {
  let generations = 0;
  let releaseOld!: () => void;
  const oldResponse = new Promise<void>((resolve) => {
    releaseOld = resolve;
  });
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    if (generations++ === 0) await oldResponse;
    await route
      .fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ b64_json: PNG, media_type: 'image/png' }] }),
      })
      .catch((error: Error) => {
        if (!/closed|aborted|disposed|invalid interception/i.test(error.message)) throw error;
      });
  });
  await page.goto('/portrait');
  await page.locator('#image-upload-portrait').setInputFiles(SAMPLE_PATH.pathname);
  await page.getByRole('button', { name: 'Generate Now', exact: true }).click();
  await expect.poll(() => generations).toBe(1);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Generate Now', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Generate Now', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Generate Another', exact: true })).toBeVisible();
  releaseOld();
  await page.waitForLoadState('networkidle');
  await expect.poll(async () => (await storedIds(page)).length).toBe(1);
  expect(generations).toBe(2);
});
