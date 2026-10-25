/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Viral “試試這個” routing: single → /edit upload, multi → /multi-person,
 * generate-class remix → /generate.
 */

import { test, expect } from '@playwright/test';

async function expandAllViral(page: import('@playwright/test').Page) {
  for (let i = 0; i < 12; i++) {
    const more = page.getByTestId('viral-show-more');
    if (!(await more.isVisible().catch(() => false))) break;
    await more.click();
  }
}

test.describe('Viral try-this flow', () => {
  test('single-person template opens editor upload with template name (keyed)', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.setItem('bloom_image_provider', 'gemini');
      localStorage.setItem('bloom_api_key', 'test-key-not-used');
    });
    await page.goto('/');
    await expect(page.getByTestId('viral-templates')).toBeVisible();
    await page.getByTestId('viral-apply-figurine-box').click();
    await expect(page).toHaveURL(/\/edit/);
    await expect(page.getByTestId('viral-editor-upload')).toBeVisible();
    await expect(page.getByTestId('viral-template-banner-upload')).toBeVisible();
    await expect(page.getByTestId('viral-template-banner-title')).toHaveText('公仔盒玩');
    await expect(page.getByTestId('viral-template-banner-thumb')).toBeVisible();
  });

  test('multi-person template opens /multi-person with scene preselected', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
    await page.goto('/');
    await expandAllViral(page);
    await page.getByTestId('viral-apply-graduation-group').scrollIntoViewIfNeeded();
    await page.getByTestId('viral-apply-graduation-group').click();
    await expect(page).toHaveURL(/\/multi-person/);
    await expect(page.getByTestId('multi-person-page')).toBeVisible();
    await expect(page.getByTestId('viral-template-banner-multiperson')).toBeVisible();
    await expect(page.getByTestId('viral-template-banner-title')).toHaveText('畢業合照');
    await expect(page.getByTestId('multi-person-template-graduation-group')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('demo single-person opens editor with matching template name', async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
    await page.goto('/');
    await page.getByTestId('viral-apply-polaroid-frame').click();
    await expect(page).toHaveURL(/\/edit/);
    await expect(page.getByTestId('viral-template-banner-editor')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('viral-template-banner-title')).toHaveText('拍立得');
  });

  test('generate-class remix lands on /generate with prompt filled', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'zh-TW');
      localStorage.setItem('bloom_theme', 'bloom');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
    const json = JSON.stringify({ v: 1, f: 'generate', p: 'neon alley', a: '3:4', q: 1 });
    const payload = Buffer.from(json, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await page.goto(`/r#${payload}`);
    await expect(page).toHaveURL(/\/generate/, { timeout: 15_000 });
    await expect(page.getByTestId('generate-prompt')).toHaveValue('neon alley');
  });
});
