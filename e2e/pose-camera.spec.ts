import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
async function seed(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-pose-camera-key');
  }, theme);
}
async function command(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  const button = nav.getByRole('button', { name, exact: true });
  if (await button.isVisible()) await button.click();
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
async function provider(page: Page) {
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
for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`pose filters and camera details remain accessible in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await seed(page, theme);
      await page.goto('/materials');
      await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('pose');
      await page.getByTestId('pose-posture-filter').selectOption('seated');
      await page.getByTestId('pose-view-filter').selectOption('profile');
      await expect(page.getByTestId('basket-add-pose-seated-profile')).toBeVisible();
      await expect(page.getByTestId('basket-add-pose-relaxed-front')).toHaveCount(0);
      await expect(page.getByTestId('basket-add-white-oxford-shirt')).toHaveCount(0);
      await page.getByRole('heading', { name: 'Seated profile', exact: true }).click();
      const metadata = page.getByTestId('pose-metadata');
      await expect(metadata).toContainText(/seated/i);
      await expect(metadata).toContainText(/profile/i);
      await expect(metadata).toContainText(/not specified|unspecified/i);
      await expect(metadata).toContainText(/full.body/i);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.goto('/materials');
      await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('pose');
      await page.getByLabel('Search materials', { exact: true }).fill('unspecified');
      await expect(page.locator('[data-testid^="basket-add-pose-"]')).toHaveCount(3);
      await page.getByLabel('Search materials', { exact: true }).fill('');
      await page.getByTestId('pose-posture-filter').selectOption('seated');
      await page
        .getByRole('combobox', { name: 'Material type', exact: true })
        .selectOption('clothing');
      await expect(page.getByTestId('pose-posture-filter')).toHaveCount(0);
      await expect(page.locator('[data-testid^="basket-add-"]')).toHaveCount(3);
    });
  }
}

test('structured pose hints reach automatic requests while manual text and history stay unchanged', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  const requests = await provider(page);
  await page.goto('/try-on');
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  let library = await command(page, 'Reference library');
  await library.getByTestId('tryon-material-white-oxford-shirt').click();
  await library.getByRole('button', { name: 'Pose', exact: true }).click();
  await library.getByTestId('pose-posture-filter').selectOption('standing');
  await library.getByTestId('pose-view-filter').selectOption('three-quarter');
  await expect(library.getByTestId('tryon-material-pose-seated-profile')).toHaveCount(0);
  await library.getByTestId('tryon-material-pose-hand-on-hip').click();
  await page.keyboard.press('Escape');
  let prompt = await command(page, 'Prompt');
  const automatic = await prompt.getByTestId('tryon-prompt').inputValue();
  expect(automatic).toContain(
    'Pose and camera: posture=standing; view=three-quarter; framing=full-body.',
  );
  expect(automatic).not.toContain('cameraHeight=');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].prompt).toBe(automatic);
  expect(requests[0].input_references).toHaveLength(3);
  await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
  await page.goto('/history');
  await page.getByRole('button', { name: 'Generate again', exact: true }).first().click();
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  prompt = await command(page, 'Prompt');
  const manual = 'Keep my identity and outfit. Use only the selected pose reference for posture.';
  await prompt.getByTestId('tryon-prompt-mode').selectOption('manual');
  await prompt.getByTestId('tryon-prompt').fill(manual);
  await page.keyboard.press('Escape');
  library = await command(page, 'Reference library');
  await library.getByRole('button', { name: 'Pose', exact: true }).click();
  await library.getByTestId('pose-posture-filter').selectOption('seated');
  await library.getByTestId('pose-view-filter').selectOption('profile');
  await library.getByTestId('tryon-material-pose-seated-profile').click();
  await page.keyboard.press('Escape');
  prompt = await command(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue(manual);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].prompt).toBe(manual);
  await expect(page.locator('.tryon-result-image img').first()).toBeVisible();
  await page.goto('/history');
  await page.getByRole('button', { name: 'Generate again', exact: true }).first().click();
  prompt = await command(page, 'Prompt');
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue(manual);
  await prompt.getByRole('button', { name: 'Reset to automatic', exact: true }).click();
  await expect
    .poll(() => prompt.getByTestId('tryon-prompt').inputValue())
    .toContain('Pose and camera: posture=seated; view=profile; framing=full-body.');
});

test('generation keeps structured camera metadata in ordered basket reference hints', async ({
  page,
}) => {
  await seed(page);
  const requests = await provider(page);
  await page.goto('/materials');
  for (const id of ['white-oxford-shirt', 'pose-seated-profile'])
    await page.getByTestId(`basket-add-${id}`).click();
  const basket = await command(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in generation', exact: true }).click();
  await expect(page.getByText('Selected reference materials', { exact: true })).toBeVisible();
  await page
    .getByTestId('generate-prompt')
    .fill('A natural fashion photograph following these references.');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  for (const request of requests) {
    expect(request.input_references).toHaveLength(2);
    expect(request.prompt).toContain('Image 2: pose:');
    expect(request.prompt).toContain(
      'Pose and camera: posture=seated; view=profile; framing=full-body.',
    );
    expect(request.prompt).not.toContain('cameraHeight=');
  }
});

test('MCP exposes structured pose filters and preserves existing recipe identifiers', async ({
  page,
  baseURL,
}) => {
  const client = new Client({ name: 'pose-camera-browser-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../mcp/server.mjs', import.meta.url))],
    env: { BLOOMRENDER_SITE_URL: `${baseURL}/` },
    stderr: 'pipe',
  });
  await seed(page);
  try {
    await client.connect(transport);
    await client.listTools();
    const result = await client.callTool({
      name: 'bloomrender_search_references',
      arguments: {
        role: 'pose',
        posture: 'seated',
        view: 'profile',
        groupId: 'seated',
        language: 'en',
      },
    });
    expect(result.isError).not.toBe(true);
    const search = result.structuredContent as {
      items: { id: string; prompt: string; pose: Record<string, string> }[];
    };
    expect(search.items.map((item) => item.id)).toEqual(['pose-seated-profile']);
    expect(search.items[0].pose).toEqual({
      groupId: 'seated',
      posture: 'seated',
      view: 'profile',
      cameraHeight: 'unspecified',
      framing: 'full-body',
    });
    expect(search.items[0].prompt).toContain('Pose and camera:');
    const incompatible = await client.callTool({
      name: 'bloomrender_search_references',
      arguments: { role: 'clothing', view: 'profile' },
    });
    expect(incompatible.isError).not.toBe(true);
    expect(incompatible.structuredContent).toMatchObject({ items: [], total: 0 });
    const clothing = await client.callTool({
      name: 'bloomrender_get_reference',
      arguments: { id: 'white-oxford-shirt' },
    });
    expect(clothing.structuredContent).not.toHaveProperty('pose');
    const composed = await client.callTool({
      name: 'bloomrender_compose_brief',
      arguments: { materialIds: ['white-oxford-shirt', 'pose-seated-profile'], language: 'en' },
    });
    expect(composed.isError).not.toBe(true);
    const composition = composed.structuredContent as {
      recipeUrl: string;
      recipe: { materialIds: string[] };
      brief: string;
    };
    expect(composition.recipe.materialIds).toEqual(['white-oxford-shirt', 'pose-seated-profile']);
    expect(composition.brief).toContain('Pose and camera:');
    await page.goto(composition.recipeUrl);
    await expect(page).toHaveURL(/\/try-on$/);
    const library = await command(page, 'Reference library');
    await expect(library.getByTestId('tryon-material-pose-seated-profile')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  } finally {
    await client.close();
  }
});
