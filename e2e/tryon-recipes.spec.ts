import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import JSZip from 'jszip';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));

async function seed(page: Page, provider = 'openrouter') {
  await page.addInitScript((selectedProvider) => {
    localStorage.setItem('bloom_language', 'en');
    if (!localStorage.getItem('bloom_image_provider'))
      localStorage.setItem('bloom_image_provider', selectedProvider);
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-private');
  }, provider);
}

async function openWorkspace(page: Page, name: 'Reference library' | 'Recipes' | 'Draft') {
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  const command = nav.getByRole('button', { name, exact: true });
  if (await command.isVisible()) await command.click();
  else {
    await nav.getByRole('button', { name: 'All photo tools', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'All photo tools', exact: true })
      .getByRole('button', { name, exact: true })
      .click();
  }
  const dialog = page.getByRole('dialog', { name, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function closeWorkspace(page: Page) {
  await page.keyboard.press('Escape');
}

async function expectSavedDraft(page: Page) {
  await openWorkspace(page, 'Draft');
  await expect(page.getByTestId('tryon-draft-status')).toContainText('saved');
  await closeWorkspace(page);
}

async function chooseMaterials(page: Page) {
  await openWorkspace(page, 'Reference library');
  for (const id of ['white-oxford-shirt', 'pose-hand-on-hip', 'lighting-soft-window']) {
    const button = page.getByTestId(`tryon-material-${id}`);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await closeWorkspace(page);
}

test('draft survives reload and can be explicitly cleared', async ({ page }) => {
  await seed(page);
  await page.goto('/try-on');
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  await chooseMaterials(page);
  await expectSavedDraft(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeEnabled();
  await openWorkspace(page, 'Reference library');
  for (const id of ['white-oxford-shirt', 'pose-hand-on-hip', 'lighting-soft-window']) {
    await expect(page.getByTestId(`tryon-material-${id}`)).toHaveAttribute('aria-pressed', 'true');
  }
  await closeWorkspace(page);
  await openWorkspace(page, 'Draft');
  await page.getByTestId('tryon-clear-draft').click();
  await expect(page.getByTestId('tryon-clear-draft')).toBeEnabled();
  await closeWorkspace(page);
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeDisabled();
  await page.reload();
  await openWorkspace(page, 'Reference library');
  await expect(page.getByTestId('tryon-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await closeWorkspace(page);
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeDisabled();
});

test('generation roles, history replay and full archive retain all inputs', async ({ page }) => {
  await seed(page);
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
  await page.goto('/try-on');
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  await page.getByTestId('tryon-keep-background').check();
  await chooseMaterials(page);
  await expect(page.getByTestId('tryon-keep-background')).toBeDisabled();
  await expect(page.getByTestId('tryon-keep-pose')).toBeDisabled();
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].input_references).toHaveLength(4);
  expect(requests[0].prompt).toContain('Image 3 is the pose reference');
  expect(requests[0].prompt).toContain('Image 4 is the lighting reference');
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(1);
  await page.goto('/history');
  await expect(page.getByRole('button', { name: 'Generate again', exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export images and recipes', exact: true }).click();
  const download = await downloadEvent;
  const path = await download.path();
  expect(path).toBeTruthy();
  const zip = await JSZip.loadAsync(readFileSync(path!));
  const metadata = JSON.parse(await zip.file('metadata.json')!.async('string'));
  const record = metadata.records[0];
  expect(record.inputsComplete).toBe(true);
  expect(record.references.map((ref: { role: string }) => ref.role)).toEqual([
    'clothing',
    'pose',
    'lighting',
  ]);
  expect(zip.file(record.source)).not.toBeNull();
  expect(JSON.stringify(metadata)).not.toContain('mock-key-private');
  expect(record.options.prompt).toContain('pose reference');
  await page.getByRole('button', { name: 'Generate again', exact: true }).click();
  await expect(page).toHaveURL(/\/try-on$/);
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeEnabled();
  await openWorkspace(page, 'Reference library');
  await expect(page.getByTestId('tryon-material-pose-hand-on-hip')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('tryon-material-lighting-soft-window')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await closeWorkspace(page);
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].input_references).toEqual(requests[0].input_references);
});

test('recipe links carry materials and settings into another browser without private photos', async ({
  page,
  browser,
}) => {
  await seed(page);
  await page.goto('/try-on');
  await chooseMaterials(page);
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'private-person.png', mimeType: 'image/png', buffer: SAMPLE });
  await openWorkspace(page, 'Recipes');
  await page.getByRole('button', { name: 'Copy recipe link', exact: true }).click();
  const url = await page.getByRole('textbox', { name: 'Recipe link', exact: true }).inputValue();
  const json = Buffer.from(url.split('#')[1], 'base64url').toString();
  expect(json).not.toMatch(/private-person|mock-key|data:|blob:/);
  const context = await browser.newContext();
  const recipient = await context.newPage();
  await seed(recipient);
  const localPath = `/r#${url.split('#')[1]}`;
  await recipient.goto(new URL(localPath, page.url()).href);
  await expect(recipient).toHaveURL(/\/try-on$/);
  await openWorkspace(recipient, 'Reference library');
  await expect(recipient.getByTestId('tryon-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(recipient.getByTestId('tryon-material-pose-hand-on-hip')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await closeWorkspace(recipient);
  await expect(
    recipient.getByRole('button', { name: 'Generate Try-On', exact: true }),
  ).toBeDisabled();
  await context.close();
});

test('material details can apply a reference and demo stays sample-only', async ({ page }) => {
  await seed(page);
  await page.goto('/materials/white-oxford-shirt');
  await expect(page.getByRole('heading', { name: 'Oxford shirt', exact: true })).toBeVisible();
  await expect(
    page.getByText('Original BloomRender reference illustration, provided under CC0 1.0.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await openWorkspace(page, 'Reference library');
  await expect(page.getByTestId('tryon-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.evaluate(() => localStorage.setItem('bloom_image_provider', 'demo'));
  await page.reload();
  await openWorkspace(page, 'Reference library');
  await expect(page.getByTestId('tryon-material-white-oxford-shirt')).toBeDisabled();
  await closeWorkspace(page);
  await openWorkspace(page, 'Draft');
  await expect(page.getByTestId('tryon-clear-draft')).toBeDisabled();
});

test('switching to demo cancels a real request and preserves the private draft', async ({
  page,
}) => {
  await seed(page);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posted = false;
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    posted = true;
    await held;
    await route
      .fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
        }),
      })
      .catch(() => {});
  });
  await page.goto('/try-on');
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  await page
    .getByTestId('tryon-clothing-input')
    .setInputFiles({ name: 'shirt.png', mimeType: 'image/png', buffer: SAMPLE });
  await expectSavedDraft(page);
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => posted).toBe(true);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
  await dialog.getByLabel('Provider', { exact: true }).selectOption('demo');
  await page.keyboard.press('Escape');
  release();
  await openWorkspace(page, 'Reference library');
  await expect(page.getByTestId('tryon-material-white-oxford-shirt')).toBeDisabled();
  await closeWorkspace(page);
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await dialog.getByLabel('Provider', { exact: true }).selectOption('openrouter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Generate Try-On', exact: true })).toBeEnabled();
  await expect(page.getByRole('img', { name: 'Clothing 1', exact: true })).toBeVisible();
});
