import { readFileSync } from 'node:fs';
import { expect, test, type Page, type Download } from '@playwright/test';
import JSZip from 'jszip';
import AxeBuilder from '@axe-core/playwright';
import { openWorkspace } from './helpers/workspace';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const POSE = 'seated-study-back-depth';

async function setup(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-never-sent');
  }, theme);
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as Window & { copiedText?: string }).copiedText = text;
        },
      },
    });
  });
}

async function readZip(download: Download) {
  const path = await download.path();
  expect(path).toBeTruthy();
  return JSZip.loadAsync(readFileSync(path!));
}

async function history(page: Page) {
  await page.goto('/history');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'image/png' });
    const rows = [
      {
        id: 'tool-first',
        type: 'tryon',
        timestamp: 300,
        blob,
        sourceBlob: blob,
        options: { prompt: 'Seated outfit first', model: 'test-model' },
        references: [
          { role: 'pose', blob, name: 'pose.png', materialId: 'seated-study-back-depth' },
        ],
      },
      {
        id: 'tool-second',
        type: 'generate',
        timestamp: 200,
        blob,
        options: { prompt: 'Landscape second' },
      },
      {
        id: 'tool-third',
        type: 'tryon',
        timestamp: 100,
        blob,
        options: { prompt: 'Seated outfit third' },
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
        rows.forEach((row) => tx.objectStore('history').put(row));
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
  }, SAMPLE.toString('base64'));
  await page.reload();
}

async function accessibility(page: Page) {
  const scan = new AxeBuilder({ page });
  if (await page.locator('dialog:modal').count()) scan.include('dialog:modal');
  const result = await scan.withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(
    result.violations
      .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
      .map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

test('batch ZIP and brief preserve exact selected atomic variants', async ({ page }) => {
  await setup(page);
  await page.goto('/materials');
  await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
  const card = page.locator(
    'article[data-material-group="seated-study:seated:eye-level:full-body"]',
  );
  await card.getByRole('button', { name: 'Back', exact: true }).click();
  await card.getByText('Advanced reference', { exact: true }).click();
  await card
    .getByRole('combobox', { name: 'Reference representation', exact: true })
    .selectOption(POSE);
  await page.getByTestId(`material-batch-toggle-${POSE}`).click();
  await page.getByTestId('material-batch-toggle-navy-tailored-jacket').click();
  const bar = page.getByTestId('material-batch-toolbar');
  await bar.getByRole('button', { name: 'Copy selected brief', exact: true }).click();
  const brief = await page.evaluate(() => (window as Window & { copiedText?: string }).copiedText);
  expect(brief).toContain('seated-study-back-depth.png');
  expect(brief).toContain('navy-tailored-jacket.svg');
  expect(brief).not.toContain('seated-study-front-lineart');
  const downloading = page.waitForEvent('download');
  await bar.getByRole('button', { name: 'Download selected ZIP', exact: true }).click();
  const zip = await readZip(await downloading);
  const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  expect(names).toHaveLength(2);
  for (const id of [POSE, 'navy-tailored-jacket']) {
    const name = names.find((name) => name.includes(id));
    expect(name).toBeTruthy();
    const extension = id === POSE ? 'png' : 'svg';
    expect(name).toMatch(new RegExp(`\\.${extension}$`));
    expect(await zip.file(name!)!.async('nodebuffer')).toEqual(
      readFileSync(new URL(`../public/images/tryon-materials/${id}.${extension}`, import.meta.url)),
    );
  }
  await expect(bar).toContainText('2 selected');
});

test('failed material ZIP is retryable and clipboard denial exposes the brief', async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    });
  });
  await page.goto('/materials');
  await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
  await page.getByTestId('material-batch-toggle-white-oxford-shirt').click();
  const bar = page.getByTestId('material-batch-toolbar');
  await bar.getByRole('button', { name: 'Copy selected brief', exact: true }).click();
  await expect(page.getByTestId('material-batch-brief')).toContainText('white-oxford-shirt.svg');
  await page.route('**/images/tryon-materials/white-oxford-shirt.svg', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await bar.getByRole('button', { name: 'Download selected ZIP', exact: true }).click();
  await expect(page.getByTestId('material-batch-feedback')).toContainText(/fail|retry/i);
  await expect(bar).toContainText('1 selected');
  await page.unroute('**/images/tryon-materials/white-oxford-shirt.svg');
  const downloading = page.waitForEvent('download');
  await bar.getByRole('button', { name: 'Download selected ZIP', exact: true }).click();
  expect(Object.keys((await readZip(await downloading)).files)).toHaveLength(1);
});

test('catalog remembers committed searches locally and allows clearing them', async ({ page }) => {
  await setup(page);
  await page.goto('/materials');
  const search = page.getByRole('searchbox', { name: 'Search materials', exact: true });
  await search.fill('seated');
  await search.press('Enter');
  await page.reload();
  await search.focus();
  const suggestions = page.getByTestId('material-search-suggestions');
  await expect(suggestions).toContainText('Recent searches');
  await suggestions.getByRole('button', { name: 'seated', exact: true }).click();
  await expect(search).toHaveValue('seated');
  await search.fill('');
  await search.focus();
  await suggestions.getByRole('button', { name: 'Clear search history', exact: true }).click();
  await page.reload();
  await search.focus();
  await expect(suggestions).not.toContainText('Recent searches');
  await expect(suggestions).toContainText('Suggested searches');
  const names = await suggestions.getByRole('button').allTextContents();
  expect(names.length).toBeGreaterThan(0);
});

test('history selection exports only chosen records and prunes hidden selections', async ({
  page,
}) => {
  await setup(page);
  await history(page);
  const bar = page.getByTestId('history-selection-toolbar');
  await page.getByTestId('history-select-tool-first').check();
  await page.getByTestId('history-select-tool-third').check();
  await expect(bar).toContainText('2 selected');
  const downloading = page.waitForEvent('download');
  await bar
    .getByRole('button', { name: 'Export selected images and recipes', exact: true })
    .click();
  const zip = await readZip(await downloading);
  const metadata = JSON.parse(await zip.file('metadata.json')!.async('string'));
  expect(metadata.records.map((item: { id: string }) => item.id)).toEqual([
    'tool-first',
    'tool-third',
  ]);
  expect(await zip.file('records/001/result.png')!.async('nodebuffer')).toEqual(SAMPLE);
  expect(await zip.file('records/001/pose-1.png')!.async('nodebuffer')).toEqual(SAMPLE);
  await page.getByRole('button', { name: 'Text to image', exact: true }).click();
  await expect(bar).toContainText('0 selected');
  await bar.getByRole('button', { name: 'Select visible', exact: true }).click();
  await expect(bar).toContainText('1 selected');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByTestId('history-select-tool-second')).toBeChecked();
  await expect(page.getByTestId('history-select-tool-first')).not.toBeChecked();
  const images = page.waitForEvent('download');
  await bar.getByRole('button', { name: 'Download selected images', exact: true }).click();
  const selectedZip = await readZip(await images);
  expect(
    Object.keys(selectedZip.files).filter((name) => !selectedZip.files[name].dir),
  ).toHaveLength(1);
});

test('history viewer walks only filtered results and keyboard respects controls', async ({
  page,
}) => {
  await setup(page);
  await history(page);
  await page.getByRole('button', { name: 'Try-On', exact: true }).click();
  await page
    .getByRole('button', { name: 'View result and references', exact: true })
    .first()
    .click();
  const viewer = page.getByRole('dialog', { name: 'Result and references', exact: true });
  await expect(viewer).toContainText('Result 1 of 2');
  await expect(viewer.getByRole('button', { name: 'Previous result', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowRight');
  await expect(viewer).toContainText('Result 2 of 2');
  await expect(viewer).toContainText('Seated outfit third');
  await expect(viewer).not.toContainText('Landscape second');
  await expect(viewer.getByRole('button', { name: 'Next result', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(viewer).toContainText('Seated outfit first');
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'View result and references', exact: true }).first(),
  ).toBeFocused();
});

test('similar material previews navigate exact cameras without changing the basket', async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/materials/${POSE}`);
  await page.getByTestId(`basket-add-${POSE}`).click();
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  const similar = viewer.getByRole('region', { name: 'Similar materials', exact: true });
  await expect(similar.getByTestId(`similar-material-${POSE}`)).toHaveCount(0);
  await expect(similar.getByRole('button')).toHaveCount(4);
  await similar.getByTestId('similar-material-seated-study-back-lineart').click();
  await expect(page).toHaveURL(/\/materials\/seated-study-back-lineart$/);
  await expect(viewer).toBeVisible();
  const ids = await page.evaluate(
    () => JSON.parse(localStorage.getItem('bloom_material_basket')!).materialBasket.materialIds,
  );
  expect(ids).toEqual([POSE]);
  await expect(viewer.getByTestId('similar-material-seated-study-back-depth')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
});

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of theme === 'bloom' ? [320, 390, 768, 1024, 1440] : [390, 1440]) {
    test(`${theme} ${width}: expanded catalog and history controls remain accessible`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await setup(page, theme);
      await history(page);
      await page.goto('/materials');
      await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
      await page.getByTestId('material-batch-toggle-white-oxford-shirt').click();
      await page.getByRole('searchbox', { name: 'Search materials', exact: true }).focus();
      await accessibility(page);
      const searchBox = await page
        .getByRole('searchbox', { name: 'Search materials', exact: true })
        .boundingBox();
      const suggestionsBox = await page.getByTestId('material-search-suggestions').boundingBox();
      expect(suggestionsBox!.y).toBeGreaterThanOrEqual(searchBox!.y + searchBox!.height);
      expect(searchBox!.width).toBeGreaterThan(250);
      await page.screenshot({ path: `test-results/catalog-search-${theme}-${width}.png` });
      await page.goto(`/materials/${POSE}`);
      await page.getByRole('button', { name: 'View image', exact: true }).click();
      await accessibility(page);
      await page.getByTestId('similar-material-seated-study-back-lineart').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/catalog-similar-${theme}-${width}.png` });
      await page.keyboard.press('Escape');
      await page.goto('/history');
      await page.getByTestId('history-select-tool-first').check();
      // Existing history result tools are outside this change; inspect the new selection surface.
      const result = await new AxeBuilder({ page })
        .include('[data-testid="history-selection-toolbar"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      await page
        .getByRole('button', { name: 'View result and references', exact: true })
        .first()
        .click();
      await accessibility(page);
      await page.screenshot({ path: `test-results/history-browser-${theme}-${width}.png` });
    });
  }
}

test('picker recommendation previews preserve selected pose and return to the library', async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/materials/${POSE}`);
  await page.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  const library = await openWorkspace(page, 'Reference library');
  const selected = library.getByTestId(`tryon-material-${POSE}`);
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await selected
    .locator('xpath=ancestor::article')
    .getByRole('button', { name: /^View image / })
    .click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  await viewer.getByTestId('similar-material-seated-study-back-lineart').click();
  await expect(viewer).toContainText('Preview only.');
  expect(
    await page.evaluate(() =>
      document.activeElement?.closest('dialog')?.getAttribute('aria-label'),
    ),
  ).toBe('Material viewer');
  await page.keyboard.press('Escape');
  await expect(library).toBeVisible();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  const prompt = await openWorkspace(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-reference-map')).toContainText('back');
});

test('history panel continuous browsing stays inside its parent modal', async ({ page }) => {
  await setup(page);
  await history(page);
  await page.getByRole('button', { name: 'Generation History', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Generation History', exact: true });
  const opener = panel
    .getByRole('button', { name: 'View result and references', exact: true })
    .first();
  await opener.click();
  const viewer = page.getByRole('dialog', { name: 'Result and references', exact: true });
  await expect(viewer).toContainText('Result 1 of 3');
  await viewer.getByRole('button', { name: 'Next result', exact: true }).click();
  await expect(viewer).toContainText('Landscape second');
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible();
  await expect(opener).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
});
