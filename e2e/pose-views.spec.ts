import { openWorkspace as command } from './helpers/workspace';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const DEPTH = readFileSync(
  new URL('../public/images/tryon-materials/standing-study-back-depth.png', import.meta.url),
);
const FRONT = 'standing-study-front-lineart';
const BACK = 'standing-study-back-depth';

async function seed(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-pose-views-never-send');
  }, theme);
}

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`pose views and paired comparison are accessible in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await seed(page, theme);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(`/materials/${FRONT}`);
      await page.getByTestId('pose-view-select').selectOption('profile');
      await expect(page).toHaveURL(/\/materials\/standing-study-profile-lineart$/);
      await page.getByTestId('pose-representation-select').selectOption('depth');
      await expect(page).toHaveURL(/\/materials\/standing-study-profile-depth$/);
      await page.getByRole('button', { name: 'View image', exact: true }).click();
      const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
      await expect(viewer).toBeVisible();
      await viewer.getByTestId('pose-compare-toggle').click();
      const comparison = viewer.getByTestId('pose-comparison');
      await expect(comparison).toBeVisible();
      const slider = viewer.getByTestId('pose-comparison-slider');
      await slider.focus();
      await slider.press('Home');
      await expect(slider).toHaveValue('0');
      await slider.press('ArrowRight');
      await expect(slider).toHaveValue('1');
      await slider.press('End');
      await expect(slider).toHaveValue('100');
      await slider.click();
      const images = [
        viewer.getByTestId('material-viewer-image'),
        viewer.getByTestId('pose-comparison-depth-image'),
      ];
      for (const image of images) {
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
          .toBe(512);
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalHeight))
          .toBe(640);
      }
      const first = await images[0].boundingBox();
      const second = await images[1].boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      for (const dimension of ['x', 'y', 'width', 'height'] as const) {
        expect(Math.abs(first![dimension] - second![dimension])).toBeLessThanOrEqual(2);
      }
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: `.taste-skill/shots/pose-views-${theme}-${width}.png` });
      await page.keyboard.press('Escape');
      await expect(viewer).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'View image', exact: true })).toBeFocused();
    });
  }
}

test('walking filter exposes one study and preserves the profile depth pair', async ({ page }) => {
  await seed(page);
  await page.goto('/materials');
  await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('pose');
  await page.getByRole('combobox', { name: 'Posture', exact: true }).selectOption('walking');
  await expect(page.locator('article[data-material-group]')).toHaveCount(1);
  await expect(
    page.locator('article[data-material-group="walking-study:walking:eye-level:full-body"]'),
  ).toBeVisible();
  await page.goto('/materials/walking-study-front-lineart');
  await page.getByTestId('pose-view-select').selectOption('profile');
  await page.getByTestId('pose-representation-select').selectOption('depth');
  await expect(page).toHaveURL(/\/materials\/walking-study-profile-depth$/);
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  await viewer.getByTestId('pose-compare-toggle').click();
  for (const id of ['material-viewer-image', 'pose-comparison-depth-image']) {
    await expect
      .poll(() =>
        viewer
          .getByTestId(id)
          .evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]),
      )
      .toEqual([512, 640]);
  }
});

test('legacy pose references never advertise unavailable views or depth pairs', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials/pose-hand-on-hip');
  await expect(page.getByTestId('pose-view-select')).toHaveCount(0);
  await expect(page.getByTestId('pose-representation-select')).toHaveCount(0);
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  await expect(page.getByTestId('pose-compare-toggle')).toHaveCount(0);
});

test('exact back-depth material survives basket, recipe and history, and sends the original PNG', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  const calls: Array<{ prompt: string; input_references: Array<{ image: string }> }> = [];
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
      }),
    });
  });
  await page.goto(`/materials/${FRONT}`);
  await page.getByTestId('pose-view-select').selectOption('back');
  await page.getByTestId('pose-representation-select').selectOption('depth');
  await expect(page).toHaveURL(new RegExp(`/materials/${BACK}$`));
  await page.getByTestId(`basket-add-${BACK}`).click();
  await page.goto('/materials/white-oxford-shirt');
  await page.getByTestId('basket-add-white-oxford-shirt').click();
  const basket = await command(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  await expect(page).toHaveURL(/\/try-on$/);
  const library = await command(page, 'Reference library');
  await expect(library.getByTestId(`tryon-material-${BACK}`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  const prompt = await command(page, 'Prompt');
  const automatic = await prompt.getByTestId('tryon-prompt').inputValue();
  expect(automatic).toContain('view=back');
  expect(automatic).toMatch(/depth/i);
  expect(automatic).toContain('not measured human depth');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => calls.length).toBe(1);
  expect(calls[0].prompt).toBe(automatic);
  expect(calls[0].input_references).toHaveLength(3);
  expect(JSON.stringify(calls[0].input_references)).toContain(DEPTH.toString('base64'));
  await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
  await page.goto('/history');
  await page.getByRole('button', { name: 'Generate again', exact: true }).first().click();
  const restored = await command(page, 'Reference library');
  await expect(restored.getByTestId(`tryon-material-${BACK}`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(restored.getByTestId('pose-view-select')).toHaveValue('back');
  await expect(restored.getByTestId('pose-representation-select')).toHaveValue('depth');
});

test('MCP exposes exact views and paired provenance and composes a matching browser recipe', async ({
  page,
  baseURL,
}) => {
  await seed(page);
  const client = new Client({ name: 'pose-views-browser-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../mcp/server.mjs', import.meta.url))],
    env: { BLOOMRENDER_SITE_URL: `${baseURL}/` },
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: 'bloomrender_get_reference',
      arguments: { id: BACK, language: 'en' },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      id: BACK,
      pose: { view: 'back', groupId: 'standing-study' },
      poseReference: { pairId: 'standing-study-back', representation: 'depth' },
      pairedReference: { id: 'standing-study-back-lineart' },
      mimeType: 'image/png',
      requiresRasterization: false,
    });
    const reference = result.structuredContent as {
      poseAlternatives: Array<{ id: string; view: string; representation: string }>;
    };
    expect(reference.poseAlternatives.map((item) => item.view).sort()).toEqual([
      'back',
      'front',
      'profile',
      'three-quarter',
    ]);
    expect(reference.poseAlternatives.every((item) => item.representation === 'depth')).toBe(true);
    const composed = await client.callTool({
      name: 'bloomrender_compose_brief',
      arguments: { materialIds: ['white-oxford-shirt', BACK], language: 'en' },
    });
    expect(composed.isError).not.toBe(true);
    const composition = composed.structuredContent as {
      recipeUrl: string;
      recipe: { v: number; materialIds: string[] };
      prompt: string;
    };
    expect(composition.recipe).toMatchObject({ v: 1, materialIds: ['white-oxford-shirt', BACK] });
    await page.goto(composition.recipeUrl);
    const library = await command(page, 'Reference library');
    await expect(library.getByTestId(`tryon-material-${BACK}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  } finally {
    await client.close();
  }
});

test('changing the selected pose camera and representation preserves manual prompts', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/try-on');
  let library = await command(page, 'Reference library');
  await library.getByTestId(`tryon-material-${FRONT}`).click();
  await expect(library.getByTestId(`tryon-material-${FRONT}`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  const prompt = await command(page, 'Prompt');
  await prompt.getByTestId('tryon-prompt-mode').selectOption('manual');
  const manual = 'Keep this exact custom instruction. Use only the chosen reference for posture.';
  await prompt.getByTestId('tryon-prompt').fill(manual);
  await page.keyboard.press('Escape');
  library = await command(page, 'Reference library');
  await library.getByTestId('pose-view-select').selectOption('back');
  await expect(library.getByTestId('tryon-material-standing-study-back-lineart')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await library.getByTestId('pose-representation-select').selectOption('depth');
  await expect(library.getByTestId(`tryon-material-${BACK}`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  const restored = await command(page, 'Prompt');
  await expect(restored.getByTestId('tryon-prompt')).toHaveValue(manual);
});

test('comparison refuses a missing paired image instead of displaying a misleading pair', async ({
  page,
}) => {
  await seed(page);
  await page.route('**/images/tryon-materials/standing-study-front-depth.png', (route) =>
    route.abort(),
  );
  await page.goto(`/materials/${FRONT}`);
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  await viewer.getByTestId('pose-compare-toggle').click();
  await expect(viewer.getByRole('alert')).toContainText(/could not|failed|unable/i);
  await expect(viewer.getByTestId('pose-comparison')).not.toBeVisible();
});

test('switching representation keeps an already loaded comparison source ready', async ({
  page,
}) => {
  await seed(page);
  await page.goto(`/materials/${BACK}`);
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  await viewer.getByTestId('pose-compare-toggle').click();
  await expect(viewer.getByTestId('pose-comparison')).toBeVisible();
  await viewer.getByTestId('pose-representation-select').selectOption('lineart');
  await expect(page).toHaveURL(/\/materials\/standing-study-back-lineart$/);
  await viewer.getByTestId('pose-compare-toggle').click();
  await expect(viewer.getByTestId('pose-comparison')).toBeVisible();
  await expect(viewer.getByText('Loading image', { exact: true })).not.toBeVisible();
});
