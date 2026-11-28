import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openWorkspace } from './helpers/workspace';
import JSZip from 'jszip';
import { MATERIAL_CLOTHING_COUNT } from './helpers/materials';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const IDS = [
  'white-crew-neck-tee',
  'black-ribbed-tank',
  'light-blue-denim-shirt',
  'oatmeal-knit-sweater',
  'heather-gray-hoodie',
  'navy-striped-long-sleeve',
  'indigo-straight-jeans',
  'sand-wide-leg-trousers',
  'olive-cargo-trousers',
  'charcoal-pleated-midi-skirt',
  'beige-trench-coat',
  'cropped-denim-jacket',
];

async function seed(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-generated-clothing-never-send');
  });
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
}

test('all twelve generated garments load in the catalog with public original PNG bytes', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials');
  await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('clothing');
  await expect(page.locator('article[data-material-group]')).toHaveCount(MATERIAL_CLOTHING_COUNT);
  for (const id of IDS) {
    const card = page.locator(`article[data-material-group="${id}"]`);
    const image = card.locator('img').first();
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]))
      .toEqual([1024, 1024]);
    const response = await page.request.get(`/images/tryon-materials/${id}.png`);
    expect(response.ok()).toBe(true);
    expect(await response.body()).toEqual(
      readFileSync(new URL(`../public/images/tryon-materials/${id}.png`, import.meta.url)),
    );
    await expect(card.getByTestId(`basket-add-${id}`)).toBeEnabled();
  }
});

test('generated garments and walking depth survive selection, mocked try-on and history replay', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  const calls: Array<{ input_references: unknown[] }> = [];
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
      }),
    });
  });
  const selected = ['white-crew-neck-tee', 'indigo-straight-jeans', 'walking-study-profile-depth'];
  for (const id of selected) {
    await page.goto(`/materials/${id}`);
    await page.getByTestId(`basket-add-${id}`).click();
  }
  const basket = await openWorkspace(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await expect(page).toHaveURL(/\/try-on$/);
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'synthetic-person.png', mimeType: 'image/png', buffer: SAMPLE });
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => calls.length).toBe(1);
  expect(calls[0].input_references).toHaveLength(4);
  for (const id of selected) {
    const bytes = readFileSync(
      new URL(`../public/images/tryon-materials/${id}.png`, import.meta.url),
    );
    expect(JSON.stringify(calls[0].input_references)).toContain(bytes.toString('base64'));
  }
  await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
  await page.goto('/history');
  await page.getByRole('button', { name: 'Generate again', exact: true }).first().click();
  const library = await openWorkspace(page, 'Reference library');
  for (const id of selected)
    await expect(library.getByTestId(`tryon-material-${id}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
});

test('generated clothing detail and viewer remain usable on mobile', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/materials/beige-trench-coat');
  await expect(page.getByText(/AI-generated clothing reference/)).toBeVisible();
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  await expect(viewer.getByTestId('material-viewer-image')).toHaveJSProperty('naturalWidth', 1024);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.taste-skill/shots/generated-clothing-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
});

test('batch ZIP exports the selected generated PNG without changing its bytes', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials');
  await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
  await page.getByTestId('material-batch-toggle-beige-trench-coat').click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download selected ZIP', exact: true }).click();
  const file = await (await download).path();
  expect(file).not.toBeNull();
  const zip = await JSZip.loadAsync(readFileSync(file!));
  expect(Object.keys(zip.files)).toEqual(['beige-trench-coat.png']);
  expect(await zip.file('beige-trench-coat.png')!.async('nodebuffer')).toEqual(
    readFileSync(
      new URL('../public/images/tryon-materials/beige-trench-coat.png', import.meta.url),
    ),
  );
});
