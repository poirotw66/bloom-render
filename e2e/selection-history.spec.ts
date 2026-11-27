import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openWorkspace } from './helpers/workspace';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const POSE = 'seated-study-back-depth';
const IDS = ['navy-tailored-jacket', POSE, 'lighting-soft-window'];

async function seed(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-selection-key-never-sent');
  }, theme);
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
}

async function addToBasket(page: Page, ids = IDS) {
  for (const id of ids) {
    await page.goto(`/materials/${id}`);
    await page.getByTestId(`basket-add-${id}`).click();
    await expect(page.getByTestId(`basket-add-${id}`)).toHaveAttribute('aria-pressed', 'true');
  }
}

async function basketIds(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('bloom_material_basket') ?? '{}').materialBasket
        ?.materialIds ?? [],
  );
}

async function seedHistory(page: Page) {
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.evaluate(
    async ({ base64, pose }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'image/png' });
      const rows = [
        {
          id: 'trace-snapshot',
          type: 'tryon',
          timestamp: 300,
          blob,
          sourceBlob: blob,
          options: {
            imageProvider: 'openai',
            model: 'gpt-image-2.6-sunburst',
            prompt: 'Use the stored pose and outfit.',
          },
          references: [
            {
              role: 'clothing',
              blob,
              name: 'original-shirt.png',
              materialId: 'navy-tailored-jacket',
            },
            { role: 'pose', blob, name: 'original-pose.png', materialId: pose },
            {
              role: 'lighting',
              blob,
              name: 'local-light.png',
              materialId: 'https://untrusted.invalid/ref.png',
            },
          ],
        },
        {
          id: 'trace-fallback',
          type: 'tryon',
          timestamp: 200,
          blob,
          options: {
            prompt: 'Legacy record with a known catalog pose.',
            recipe: {
              v: 1,
              kind: 'tryon',
              materialIds: [pose],
              settings: {
                background: 'studio',
                style: 'original',
                outputSize: '1K',
                aspectRatio: '9:16',
                quantity: 1,
                keepBackground: true,
                keepPose: true,
              },
            },
          },
        },
        {
          id: 'trace-empty',
          type: 'tryon',
          timestamp: 100,
          blob,
          options: { prompt: 'Legacy result only.' },
        },
      ];
      await new Promise<void>((resolve, reject) => {
        const opening = indexedDB.open('bloomrender', 1);
        opening.onupgradeneeded = () =>
          opening.result.createObjectStore('history', { keyPath: 'id' });
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const tx = db.transaction('history', 'readwrite');
          for (const row of rows) tx.objectStore('history').put(row);
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
    },
    { base64: SAMPLE.toString('base64'), pose: POSE },
  );
  await page.reload();
}

async function assertAccessible(page: Page) {
  const scan = new AxeBuilder({ page });
  if (await page.locator('dialog:modal').count()) scan.include('dialog:modal');
  const result = await scan.withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(
    result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

test('basket clear restores exact material variants once and expires on edits or reload', async ({
  page,
}) => {
  await seed(page);
  await addToBasket(page);
  const basket = await openWorkspace(page, 'Material basket');
  await basket.getByRole('button', { name: 'Clear basket', exact: true }).click();
  expect(await basketIds(page)).toEqual([]);
  await basket.getByRole('button', { name: 'Undo clear', exact: true }).click();
  expect(await basketIds(page)).toEqual(IDS);
  await basket.getByRole('button', { name: 'Clear basket', exact: true }).click();
  await page.keyboard.press('Escape');
  await addToBasket(page, ['white-oxford-shirt']);
  await openWorkspace(page, 'Material basket');
  await expect(basket.getByRole('button', { name: 'Undo clear', exact: true })).toHaveCount(0);
  await basket.getByRole('button', { name: 'Clear basket', exact: true }).click();
  await page.reload();
  await openWorkspace(page, 'Material basket');
  await expect(basket.getByRole('button', { name: 'Undo clear', exact: true })).toHaveCount(0);
  expect(await basketIds(page)).toEqual([]);
});

test('catalog batch actions preserve exact variants and reject conflicts atomically', async ({
  page,
}) => {
  await seed(page);
  await addToBasket(page, ['navy-tailored-jacket']);
  await page.goto('/materials');
  await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
  const bar = page.getByTestId('material-batch-toolbar');
  await bar.getByRole('button', { name: 'Select visible', exact: true }).click();
  await expect(bar).toContainText('11 selected');
  await bar.getByRole('button', { name: 'Add selected to basket', exact: true }).click();
  expect(await basketIds(page)).toEqual(['navy-tailored-jacket']);
  await expect(bar).toContainText('11 selected');
  await bar.getByRole('button', { name: 'Deselect all', exact: true }).click();
  const card = page.locator(
    'article[data-material-group="seated-study:seated:eye-level:full-body"]',
  );
  await card.getByRole('button', { name: 'Back', exact: true }).click();
  await card.getByText('Advanced reference', { exact: true }).click();
  await card
    .getByRole('combobox', { name: 'Reference representation', exact: true })
    .selectOption(POSE);
  await page.getByTestId(`material-batch-toggle-${POSE}`).click();
  await bar.getByRole('button', { name: 'Add favorites', exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('bloom_material_preferences')!).favoriteIds,
    ),
  ).toEqual([POSE]);
  await bar.getByRole('button', { name: 'Add selected to basket', exact: true }).click();
  expect(await basketIds(page)).toEqual(['navy-tailored-jacket', POSE]);
  await page.getByTestId(`material-batch-toggle-${POSE}`).click();
  await card.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(bar).toContainText('0 selected');
});

test('history traces stored blobs, safely links exact variants and labels legacy fallback', async ({
  page,
}) => {
  await seed(page);
  await seedHistory(page);
  await page.goto('/history');
  await page
    .getByRole('button', { name: 'View result and references', exact: true })
    .first()
    .click();
  const viewer = page.getByRole('dialog', { name: 'Result and references', exact: true });
  const refs = viewer.getByTestId('history-reference-list');
  await expect(refs.locator('li')).toHaveCount(4);
  for (const img of await refs.locator('img').all()) {
    expect(await img.getAttribute('src')).toMatch(/^blob:/);
    await expect(img).toHaveJSProperty('naturalWidth', 512);
  }
  await expect(refs.getByRole('link', { name: 'Open material', exact: true })).toHaveCount(2);
  await expect(refs.getByRole('link').nth(1)).toHaveAttribute('href', `/materials/${POSE}`);
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
  await page
    .getByRole('button', { name: 'View result and references', exact: true })
    .nth(1)
    .click();
  await expect(viewer).toContainText('Current catalog preview (not the original input snapshot)');
  await viewer.getByRole('link', { name: 'Open material', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/materials/${POSE}$`));
  await page.goto('/history');
  await page
    .getByRole('button', { name: 'View result and references', exact: true })
    .nth(2)
    .click();
  await expect(viewer).toContainText('Missing images cannot be recovered.');
  await expect(viewer.getByTestId('history-reference-list').locator('li')).toHaveCount(0);
});

test('nested history viewer keeps parent dialog and restores focus on Escape', async ({ page }) => {
  await seed(page);
  await seedHistory(page);
  await page.getByRole('button', { name: 'Generation History', exact: true }).click();
  const parent = page.getByRole('dialog', { name: /Generation History/ });
  const opener = parent
    .getByRole('button', { name: 'View result and references', exact: true })
    .first();
  await opener.click();
  await page.keyboard.press('Escape');
  await expect(parent).toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await opener.click();
  await page
    .getByRole('dialog', { name: 'Result and references', exact: true })
    .getByRole('link', { name: 'Open material', exact: true })
    .nth(1)
    .click();
  await expect(page).toHaveURL(new RegExp(`/materials/${POSE}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`${theme} ${width}: batch and history viewer remain accessible`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await seed(page, theme);
      await seedHistory(page);
      await page.goto('/materials');
      await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
      await page
        .getByTestId('material-batch-toolbar')
        .getByRole('button', { name: 'Select visible', exact: true })
        .click();
      await assertAccessible(page);
      await page.goto('/history');
      await page
        .getByRole('button', { name: 'View result and references', exact: true })
        .first()
        .click();
      await assertAccessible(page);
      await page.screenshot({
        path: `test-results/selection-history-${theme}-${width}.png`,
        fullPage: true,
      });
    });
  }
}

test('try-on clear and undo retain person, prompt and completed output without generation', async ({
  page,
}) => {
  await seed(page);
  let calls = 0;
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    calls += 1;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
      }),
    });
  });
  await addToBasket(page);
  const basket = await openWorkspace(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  const prompt = await openWorkspace(page, 'Prompt');
  await prompt.getByTestId('tryon-prompt-mode').selectOption('manual');
  await prompt.getByTestId('tryon-prompt').fill('Keep the selected seated pose.');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeEnabled();
  const person = page.getByRole('img', { name: 'Person photo', exact: true }).first();
  const personUrl = await person.getAttribute('src');
  await page.getByRole('button', { name: 'Clear references', exact: true }).click();
  await expect(person).toHaveAttribute('src', personUrl!);
  await expect(page.getByRole('img', { name: 'Clothing 1', exact: true })).toHaveCount(0);
  await openWorkspace(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue('Keep the selected seated pose.');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Undo clear', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Clothing 1', exact: true })).toBeVisible();
  await openWorkspace(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-reference-map')).toContainText('Pose');
  await page.keyboard.press('Escape');
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'Clear references', exact: true }).click();
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: SAMPLE });
  await expect(page.getByRole('button', { name: 'Undo clear', exact: true })).toHaveCount(0);
});
