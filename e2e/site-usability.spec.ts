import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { openWorkspace } from './helpers/workspace';

const ROUTES = [
  '/',
  '/generate',
  '/edit',
  '/try-on',
  '/materials',
  '/materials/seated-study-back-depth',
  '/history',
  '/idphoto',
  '/idphoto/batch',
  '/portrait',
  '/travel',
  '/themed',
  '/couple-group',
  '/multi-person',
  '/style-collage',
  '/enhance',
  '/restore',
  '/prompt-gallery',
  '/photography-service',
];

async function prepare(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
  }, theme);
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
}

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    for (const route of ROUTES) {
      test(`${theme} ${route} at ${width}: clear page identity, usable controls and accessible layout`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await prepare(page, theme);
        await page.goto(route);
        await expect(page.locator('main h1').first()).toBeVisible();
        if (route === '/') {
          await expect(page.getByTestId('viral-templates')).toBeVisible();
          await expect(page.locator('.home-hero')).toHaveClass(/is-entered/);
        }
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            document
              .getAnimations()
              .filter((animation) => {
                const timing = animation.effect?.getComputedTiming();
                return timing && Number.isFinite(timing.endTime) && Number(timing.endTime) <= 2000;
              })
              .map((animation) => animation.finished.catch(() => undefined)),
          );
        });
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        await page.screenshot({ path: testInfo.outputPath('screen.png') });
        expect(
          result.violations
            .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
            .map((item) => ({
              id: item.id,
              nodes: item.nodes.map((node) => ({
                target: node.target,
                summary: node.failureSummary,
              })),
            })),
        ).toEqual([]);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        const unnamed = await page
          .locator('main button:visible')
          .evaluateAll(
            (buttons) =>
              buttons.filter(
                (button) =>
                  !button.textContent?.trim() &&
                  !button.getAttribute('aria-label') &&
                  !button.getAttribute('aria-labelledby') &&
                  !button.getAttribute('title'),
              ).length,
          );
        expect(unnamed).toBe(0);
      });
    }
  }
}

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
for (const width of [390, 1440]) {
  test(`material selection to finished try-on at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page);
    await page.addInitScript(() => {
      localStorage.setItem('bloom_image_provider', 'openrouter');
      sessionStorage.setItem('bloom_openrouter_api_key', 'mock-usability-key');
    });
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
    await page.goto('/materials');
    await page.getByTestId('basket-add-white-oxford-shirt').click();
    await page.getByTestId('basket-add-pose-hand-on-hip').click();
    const selection = page.getByTestId('material-selection-bar');
    await expect(selection).toContainText('2 references selected');
    await selection.getByRole('button', { name: 'Continue to try-on', exact: true }).click();
    await expect(page).toHaveURL(/\/try-on$/);
    await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
    await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Your Photo', exact: true })).toBeFocused();
    expect(calls).toBe(0);
    await page
      .getByTestId('tryon-person-input')
      .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
    await expect(page.getByRole('combobox', { name: /^Output Size/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Aspect Ratio', exact: true })).toBeVisible();
    const library = await openWorkspace(page, 'Reference library');
    await expect(library.getByTestId('tryon-material-white-oxford-shirt')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const done = library.getByRole('button', { name: 'Done selecting references', exact: true });
    await done.click();
    await expect(library).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'Clothing 1', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
    await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
    expect(calls).toBe(1);
  });
}

test('missing clothing points to the picker and selected references have an explicit done action', async ({
  page,
}) => {
  await prepare(page);
  await page.goto('/try-on');
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  const choose = page.getByRole('button', { name: 'Choose clothing', exact: true });
  await expect(choose).toBeFocused();
  await choose.click();
  const library = page.getByRole('dialog', { name: 'Reference library', exact: true });
  await library.getByTestId('tryon-material-white-oxford-shirt').click();
  await expect(library.getByTestId('tryon-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(library.getByTestId('tryon-materials-footer')).toContainText(
    /1 reference(?:s)? selected/,
  );
  await library.getByRole('button', { name: 'Done selecting references', exact: true }).click();
  await expect(choose).toBeFocused();
});

test.describe('Keyboard file pickers and result controls', () => {
  test.describe.configure({ mode: 'serial' });
  for (const [route, inputId] of [
    ['/idphoto', 'image-upload-idphoto'],
    ['/portrait', 'image-upload-portrait'],
    ['/themed', 'image-upload-themed'],
    ['/restore', 'restore-image-upload'],
    ['/enhance', 'enhance-image-upload'],
  ]) {
    test(`${route} starts with a keyboard-operable upload and keeps replacement available`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await prepare(page);
      await page.goto(route);
      const upload = page.getByRole('button', { name: 'Upload an Image', exact: true });
      await expect(upload).toBeVisible();
      const bounds = await upload.boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThan(900);
      await upload.focus();
      const choosing = page.waitForEvent('filechooser');
      await upload.press('Enter');
      await (
        await choosing
      ).setFiles({ name: 'sample.png', mimeType: 'image/png', buffer: SAMPLE });
      await expect(page.locator(`#${inputId}`)).toBeEnabled();
      await expect(page.getByRole('img', { name: 'Preview', exact: true })).toBeVisible();
      const change = page.getByRole('button', { name: /^Change photo$/i });
      await change.focus();
      const replacing = page.waitForEvent('filechooser');
      await change.press('Space');
      await (
        await replacing
      ).setFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: SAMPLE });
      await expect(page.getByRole('img', { name: 'Preview', exact: true })).toHaveJSProperty(
        'naturalWidth',
        512,
      );
    });
  }

  test('history format labels focus their own result instead of the first result', async ({
    page,
  }) => {
    await prepare(page);
    await page.goto('/history');
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.evaluate(async (base64) => {
      const blob = new Blob([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))], {
        type: 'image/png',
      });
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('bloomrender', 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore('history', { keyPath: 'id' });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('history', 'readwrite');
          for (const id of ['one', 'two'])
            tx.objectStore('history').put({
              id,
              type: 'tryon',
              timestamp: id === 'one' ? 2 : 1,
              blob,
            });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    }, SAMPLE.toString('base64'));
    await page.reload();
    const cards = page.locator('main article');
    await expect(cards).toHaveCount(2);
    for (const card of await cards.all()) {
      const format = card.getByRole('combobox', { name: 'Format', exact: true });
      await card.getByText('Format', { exact: true }).click();
      await expect(format).toBeFocused();
      await format.selectOption('webp');
      await expect(card.getByRole('slider', { name: 'Quality', exact: true })).toBeVisible();
      await card.getByText('More image tools', { exact: true }).click();
    }
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(
      result.violations
        .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
        .map((item) => item.id),
    ).toEqual([]);
  });

  for (const [route, inputId, removeName] of [
    ['/couple-group', 'image-upload-couple-group', 'Remove photo'],
    ['/idphoto/batch', 'batch-image-upload', 'Remove file'],
  ]) {
    test(`${route} uploaded photos have visible touch-sized removal controls`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await prepare(page);
      await page.goto(route);
      await page.locator(`#${inputId}`).setInputFiles([
        { name: 'one.png', mimeType: 'image/png', buffer: SAMPLE },
        { name: 'two.png', mimeType: 'image/png', buffer: SAMPLE },
      ]);
      const remove = page.getByRole('button', {
        name: route === '/idphoto/batch' ? /^Remove file(?: \d+)?$/ : removeName,
        exact: true,
      });
      await expect(remove).toHaveCount(2);
      await remove.first().scrollIntoViewIfNeeded();
      const bounds = await remove.first().boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(
        await remove.first().evaluate((button) => Number(getComputedStyle(button).opacity)),
      ).toBe(1);
      await remove.first().click();
      await expect(remove).toHaveCount(1);
    });
  }

  test('travel opens photo upload before the map and exposes photo removal on touch', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await prepare(page);
    await page.goto('/travel');
    const quick = page.getByTestId('travel-quick-upload');
    const bounds = await quick.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThan(900);
    await quick.focus();
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (await chooser).setFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
    await expect(page.getByRole('img', { name: 'Person 1', exact: true })).toBeVisible();
    const remove = page.getByRole('button', { name: /Remove photo/, exact: true });
    await remove.scrollIntoViewIfNeeded();
    const area = await remove.boundingBox();
    expect(area!.width).toBeGreaterThanOrEqual(44);
    expect(area!.height).toBeGreaterThanOrEqual(44);
    await remove.click();
    await expect(page.getByRole('img', { name: 'Person 1', exact: true })).toHaveCount(0);
  });

  test('couple photo selection supports adding one person at a time', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await prepare(page);
    await page.goto('/couple-group');
    await page.getByRole('button', { name: 'Upload an Image', exact: true }).focus();
    const first = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (await first).setFiles({ name: 'person-one.png', mimeType: 'image/png', buffer: SAMPLE });
    await expect(page.getByRole('img', { name: 'Person 1', exact: true })).toBeVisible();
    const second = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Add Photo/, exact: true }).click();
    await (
      await second
    ).setFiles({ name: 'person-two.png', mimeType: 'image/png', buffer: SAMPLE });
    await expect(page.getByRole('img', { name: 'Person 1', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Person 2', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Photo', exact: true })).toBeEnabled();
  });
});

for (const width of [390, 1440]) {
  test(`multi-person starts at its heading and upload instead of jumping to a template at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page);
    await page.goto('/multi-person');
    await expect(
      page
        .getByTestId('multi-person-templates')
        .getByRole('button', { name: 'Selected', exact: true }),
    ).toBeAttached();
    await expect(page.locator('main h1')).toBeInViewport();
    await expect(page.getByTestId('multi-person-upload')).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  });
}
