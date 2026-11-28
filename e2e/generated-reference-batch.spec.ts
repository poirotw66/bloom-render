import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openWorkspace } from './helpers/workspace';
import type { TryOnMaterial } from '../constants/tryOnMaterials';
import { GENERATED_REFERENCE_BATCH } from '../constants/generatedReferenceBatch.mjs';

const catalog: TryOnMaterial[] = JSON.parse(
  readFileSync(new URL('../constants/tryOnMaterials.json', import.meta.url), 'utf8'),
);
const batch = catalog.filter((item) => Object.hasOwn(GENERATED_REFERENCE_BATCH, item.id));
const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));

async function seed(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-new-reference-batch-never-send');
  });
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
}

test('all sixty approved references ship exact original PNGs and source records', async ({
  request,
}) => {
  test.setTimeout(90_000);
  expect(batch).toHaveLength(60);
  expect(batch.filter((item) => item.role === 'clothing')).toHaveLength(36);
  expect(batch.filter((item) => item.role === 'pose')).toHaveLength(24);
  const sources = new Set(batch.map((item) => item.source));
  expect(sources.size).toBe(1);
  for (const item of batch) {
    const response = await request.get(`/${item.image}`);
    expect(response.ok(), item.id).toBe(true);
    expect(await response.body()).toEqual(
      readFileSync(new URL(`../public/${item.image}`, import.meta.url)),
    );
  }
});

for (const [posture, , id] of [
  ['squatting', 4, 'pose-full-single-p061'],
  ['kneeling', 2, 'pose-full-single-p033'],
  ['lying', 2, 'pose-full-single-p050'],
] as const) {
  test(`new ${posture} filter and single-view viewer are truthful`, async ({ page }) => {
    await seed(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/materials');
    await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('pose');
    await page.getByRole('combobox', { name: 'Posture', exact: true }).selectOption(posture);
    const count = catalog.filter((item) => item.pose?.posture === posture).length;
    await expect(page.locator('article[data-material-group]')).toHaveCount(count);
    await page.goto(`/materials/${id}`);
    await expect(page.getByTestId('pose-view-select')).toHaveCount(0);
    await expect(page.getByTestId('pose-representation-select')).toHaveCount(0);
    await expect(page.getByText(/AI-generated pose reference/)).toBeVisible();
    await page.getByRole('button', { name: 'View image', exact: true }).click();
    const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
    await expect(viewer.getByTestId('material-viewer-image')).toHaveJSProperty(
      'naturalWidth',
      1024,
    );
    await expect(viewer.getByTestId('pose-compare-toggle')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `.taste-skill/shots/generated-reference-${posture}.png` });
  });
}

for (const [label, ids] of [
  ['original PNG', ['navy-wrap-dress', 'pose-full-single-p061']],
  ['WebP outfit and pose', ['outfit-spr-0032', 'pose-full-single-p018']],
] as const) {
  test(`${label} references preserve exact input bytes through try-on and replay`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await seed(page);
    const calls: Array<{ prompt: string; input_references: unknown[] }> = [];
    await page.route('https://openrouter.ai/api/v1/images', async (route) => {
      calls.push(route.request().postDataJSON());
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
        }),
      });
    });
    for (const id of ids) {
      await page.goto(`/materials/${id}`);
      await page.getByTestId(`basket-add-${id}`).click();
    }
    const basket = await openWorkspace(page, 'Material basket');
    await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
    await page
      .getByTestId('tryon-person-input')
      .setInputFiles({ name: 'synthetic-person.png', mimeType: 'image/png', buffer: SAMPLE });
    await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0].input_references).toHaveLength(3);
    expect(calls[0].prompt).not.toMatch(
      /Create a clean studio flat lay|Create one original neutral pose-reference/,
    );
    for (const id of ids)
      expect(JSON.stringify(calls[0].input_references)).toContain(
        readFileSync(
          new URL(`../public/${catalog.find((item) => item.id === id)!.image}`, import.meta.url),
        ).toString('base64'),
      );
    await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
    await page.goto('/history');
    await page.getByRole('button', { name: 'Generate again', exact: true }).first().click();
    const library = await openWorkspace(page, 'Reference library');
    for (const id of ids)
      await expect(library.getByTestId(`tryon-material-${id}`)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
  });
}
