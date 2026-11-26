import { openWorkspace as command } from './helpers/workspace';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import JSZip from 'jszip';
import AxeBuilder from '@axe-core/playwright';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const MATERIALS = ['white-oxford-shirt', 'pose-hand-on-hip', 'lighting-soft-window'];
const MANUAL =
  'PRIVATE_NOTE: Keep the same person, wear the selected shirt and use soft window lighting.';

async function seed(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-workflow-key-private');
  });
}

async function collect(page: Page) {
  await page.goto('/materials');
  for (const id of MATERIALS) {
    const button = page.getByTestId(`basket-add-${id}`);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
}

async function mockProvider(page: Page) {
  const requests: Array<{ prompt: string; input_references: unknown[] }> = [];
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
      }),
    });
  });
  return requests;
}

test('basket persists across pages and manual try-on prompt survives draft, sharing and history replay', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  const requests = await mockProvider(page);
  await collect(page);
  await page.goto('/history');
  await page.goto('/materials');
  for (const id of MATERIALS)
    await expect(page.getByTestId(`basket-add-${id}`)).toHaveAttribute('aria-pressed', 'true');
  const basket = await command(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await expect(page).toHaveURL(/\/try-on$/);
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'private-person.png', mimeType: 'image/png', buffer: SAMPLE });
  let prompt = await command(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-reference-map')).toContainText(/person/i);
  await expect(prompt.getByTestId('tryon-reference-map')).toContainText(/pose/i);
  await prompt.getByTestId('tryon-prompt-mode').selectOption('manual');
  await prompt.getByTestId('tryon-prompt').fill(MANUAL);
  await page.keyboard.press('Escape');
  const recipes = await command(page, 'Recipes');
  const include = recipes.getByRole('checkbox', {
    name: 'Include custom prompt in recipe',
    exact: true,
  });
  await expect(include).not.toBeChecked();
  await recipes.getByRole('button', { name: 'Copy recipe link', exact: true }).click();
  const publicLink = await recipes
    .getByRole('textbox', { name: 'Recipe link', exact: true })
    .inputValue();
  expect(Buffer.from(publicLink.split('#')[1], 'base64url').toString()).not.toContain(
    'PRIVATE_NOTE',
  );
  await include.check();
  await recipes.getByRole('button', { name: 'Copy recipe link', exact: true }).click();
  const includedLink = await recipes
    .getByRole('textbox', { name: 'Recipe link', exact: true })
    .inputValue();
  expect(Buffer.from(includedLink.split('#')[1], 'base64url').toString()).toContain(MANUAL);
  await page.keyboard.press('Escape');
  await command(page, 'Draft');
  await expect(page.getByTestId('tryon-draft-status')).toContainText('saved');
  await page.keyboard.press('Escape');
  await page.reload();
  prompt = await command(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-prompt-mode')).toHaveValue('manual');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue(MANUAL);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].prompt).toBe(MANUAL);
  expect(requests[0].input_references).toHaveLength(4);
  await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
  await page.goto('/history');
  await page.getByRole('button', { name: 'Generate again', exact: true }).click();
  await expect(page).toHaveURL(/\/try-on$/);
  prompt = await command(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue(MANUAL);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].prompt).toBe(MANUAL);
  expect(requests[1].input_references).toEqual(requests[0].input_references);
});

test('automatic prompt follows references while manual edits remain until reset', async ({
  page,
}) => {
  await seed(page);
  await collect(page);
  const basket = await command(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  let prompt = await command(page, 'Prompt');
  const automatic = await prompt.getByTestId('tryon-prompt').inputValue();
  expect(automatic).toContain('pose reference');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveAttribute('readonly', '');
  await prompt.getByTestId('tryon-prompt-mode').selectOption('manual');
  await prompt.getByTestId('tryon-prompt').fill(MANUAL);
  await page.keyboard.press('Escape');
  const library = await command(page, 'Reference library');
  await library.getByTestId('tryon-material-pose-seated-profile').click();
  await page.keyboard.press('Escape');
  prompt = await command(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue(MANUAL);
  await prompt.getByRole('button', { name: 'Reset to automatic', exact: true }).click();
  await expect(prompt.getByTestId('tryon-prompt-mode')).toHaveValue('automatic');
  await expect(prompt.getByTestId('tryon-prompt')).not.toHaveValue(MANUAL);
  await expect(prompt.getByTestId('tryon-prompt')).not.toHaveValue(automatic);
});

test('generation sends every basket reference and history export retains the inputs', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  const requests = await mockProvider(page);
  await collect(page);
  const basket = await command(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in generation', exact: true }).click();
  await expect(page).toHaveURL(/\/generate$/);
  await expect(page.getByText('Selected reference materials', { exact: true })).toBeVisible();
  await page
    .getByTestId('generate-prompt')
    .fill('A person wearing this outfit, following the pose and light references.');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  for (const request of requests) expect(request.input_references).toHaveLength(3);
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(2);
  await page.goto('/history');
  await expect(page.getByRole('button', { name: 'Generate again', exact: true })).toHaveCount(2);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export images and recipes', exact: true }).click();
  const file = await (await downloading).path();
  expect(file).toBeTruthy();
  const zip = await JSZip.loadAsync(readFileSync(file!));
  const metadata = JSON.parse(await zip.file('metadata.json')!.async('string'));
  expect(metadata.records).toHaveLength(2);
  for (const record of metadata.records) {
    expect(record.references).toHaveLength(3);
    expect(
      record.references.map((reference: { materialId: string }) => reference.materialId),
    ).toEqual(MATERIALS);
    for (const reference of record.references) expect(zip.file(reference.file)).not.toBeNull();
  }
  expect(JSON.stringify(metadata)).not.toContain('mock-workflow-key-private');
  await page.getByRole('button', { name: 'Generate again', exact: true }).first().click();
  await expect(page).toHaveURL(/\/generate$/);
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  await expect.poll(() => requests.length).toBe(4);
  expect(requests[2].input_references).toEqual(requests[0].input_references);
});

test('mobile basket restores focus without overflowing the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await collect(page);
  const basket = await command(page, 'Material basket');
  await expect(page.getByRole('dialog', { name: 'All photo tools', exact: true })).toHaveCount(0);
  await expect
    .poll(() => basket.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(basket).not.toBeVisible();
  await expect(
    page
      .getByRole('button', { name: /^(?:Basket|Material basket)(?:\s|$)/ })
      .filter({ visible: true })
      .first(),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const reopened = await command(page, 'Material basket');
  await reopened.getByRole('button', { name: 'Clear basket', exact: true }).click();
  await expect(
    reopened.getByRole('button', { name: 'Use in generation', exact: true }),
  ).toBeDisabled();
});

test('a consumed basket transfer never resurrects a reference removed from the saved draft', async ({
  page,
}) => {
  await seed(page);
  await collect(page);
  const basket = await command(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  let library = await command(page, 'Reference library');
  await expect(library.getByTestId('tryon-material-lighting-soft-window')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await library.getByTestId('tryon-material-lighting-soft-window').click();
  await expect(library.getByTestId('tryon-material-lighting-soft-window')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.keyboard.press('Escape');
  await command(page, 'Draft');
  await expect(page.getByTestId('tryon-draft-status')).toContainText('saved');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  library = await command(page, 'Reference library');
  await expect(library.getByTestId('tryon-material-lighting-soft-window')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  for (const id of ['white-oxford-shirt', 'pose-hand-on-hip'])
    await expect(library.getByTestId(`tryon-material-${id}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
});

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`material dialogs remain accessible in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await seed(page);
      await page.addInitScript((theme) => localStorage.setItem('bloom_theme', theme), theme);
      await collect(page);
      const basket = await command(page, 'Material basket');
      async function expectAccessible() {
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(
          results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
        ).toEqual([]);
      }
      await expectAccessible();
      await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
      await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
      await command(page, 'Prompt');
      await expectAccessible();
    });
  }
}
