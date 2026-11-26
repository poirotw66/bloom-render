import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));

test('a failed draft save warns outside the closed dialog and keeps uploaded photos usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-not-used');
    const state = window as Window & { failedDraftWrites?: number };
    state.failedDraftWrites = 0;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (this.transaction.db.name === 'bloomrender-tryon-draft' && this.name === 'draft') {
        state.failedDraftWrites!++;
        throw new DOMException('Storage full', 'QuotaExceededError');
      }
      return key === undefined ? put.call(this, value) : put.call(this, value, key);
    };
  });
  await page.goto('/try-on');
  const draftDialog = page.getByRole('dialog', { name: 'Draft', exact: true });
  await expect(draftDialog).toBeHidden();
  await page.getByTestId('tryon-person-input').setInputFiles({
    name: 'person.png',
    mimeType: 'image/png',
    buffer: SAMPLE,
  });
  const warning = page.getByRole('alert').filter({ hasText: /draft.*not.*saved/i });
  await expect(warning).toBeVisible();
  await expect(warning).toContainText(/keep.*original photos/i);
  await page.getByTestId('tryon-clothing-input').setInputFiles({
    name: 'clothing.png',
    mimeType: 'image/png',
    buffer: SAMPLE,
  });
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { failedDraftWrites?: number }).failedDraftWrites),
    )
    .toBeGreaterThanOrEqual(2);
  await expect(draftDialog).toBeHidden();
  await expect(warning).toBeVisible();
  for (const name of ['Person photo', 'Clothing 1']) {
    const photo = page.getByRole('img', { name, exact: true });
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  }
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeEnabled();
});
