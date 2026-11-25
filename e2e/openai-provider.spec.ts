import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const KEY = 'sk-openai-e2e-never-send';

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function selectOpenAI(page: Page) {
  const settings = await openSettings(page);
  await settings.getByLabel('Provider', { exact: true }).selectOption('openai');
  await settings.getByLabel('OpenAI API Key', { exact: true }).fill(KEY);
  return settings;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    sessionStorage.setItem('bloom_api_key', 'gemini-private-key');
    sessionStorage.setItem('bloom_openrouter_api_key', 'openrouter-private-key');
  });
});

test('OpenAI Settings isolates keys, restores session choice, and remembers only with opt-in', async ({
  page,
}) => {
  const externalRequests: string[] = [];
  await page.route(
    /https:\/\/(?:api\.openai\.com|generativelanguage\.googleapis\.com|openrouter\.ai)\//,
    async (route) => {
      externalRequests.push(route.request().url());
      await route.abort();
    },
  );
  await page.goto('/generate');
  let settings = await selectOpenAI(page);
  const key = settings.getByLabel('OpenAI API Key', { exact: true });
  await expect(key).toHaveAttribute('type', 'password');
  await expect(settings.getByTestId('openai-model-select')).toHaveValue('gpt-image-2.6-sunburst');
  await settings.getByTestId('openai-model-select').selectOption('gpt-image-1.5');
  await expect
    .poll(() =>
      page.evaluate(() => ({
        session: sessionStorage.getItem('bloom_openai_api_key'),
        remembered: localStorage.getItem('bloom_openai_api_key'),
        model: localStorage.getItem('bloom_openai_model'),
        gemini: sessionStorage.getItem('bloom_api_key'),
        openrouter: sessionStorage.getItem('bloom_openrouter_api_key'),
      })),
    )
    .toEqual({
      session: KEY,
      remembered: null,
      model: 'gpt-image-1.5',
      gemini: 'gemini-private-key',
      openrouter: 'openrouter-private-key',
    });
  await settings.getByLabel('Provider', { exact: true }).selectOption('gemini');
  await expect(settings.getByLabel('API Key', { exact: true })).toHaveValue('gemini-private-key');
  await settings.getByLabel('Provider', { exact: true }).selectOption('openai');
  await expect(key).toHaveValue(KEY);
  await expect(key).toHaveAttribute('type', 'password');
  await page.keyboard.press('Escape');
  await page.reload();
  settings = await openSettings(page);
  await expect(settings.getByLabel('Provider', { exact: true })).toHaveValue('openai');
  await expect(settings.getByLabel('OpenAI API Key', { exact: true })).toHaveValue(KEY);
  await expect(settings.getByTestId('openai-model-select')).toHaveValue('gpt-image-1.5');
  await settings.getByTestId('remember-api-key').check();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('bloom_openai_api_key')))
    .toBe(KEY);
  await page.keyboard.press('Escape');
  await page.evaluate(() => sessionStorage.removeItem('bloom_openai_api_key'));
  await page.reload();
  settings = await openSettings(page);
  await expect(settings.getByLabel('OpenAI API Key', { exact: true })).toHaveValue(KEY);
  await expect(settings.getByTestId('remember-api-key')).toBeChecked();
  await settings.getByTestId('remember-api-key').uncheck();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        remembered: localStorage.getItem('bloom_openai_api_key'),
        session: sessionStorage.getItem('bloom_openai_api_key'),
      })),
    )
    .toEqual({ remembered: null, session: KEY });
  expect(externalRequests).toEqual([]);
});

test('OpenAI generation uses JSON and editor plus try-on send multipart reference images without Gemini calls', async ({
  page,
}) => {
  const calls: Array<{
    url: string;
    authorization: string | undefined;
    contentType: string;
    body: Buffer;
  }> = [];
  const forbidden: string[] = [];
  await page.route(
    /https:\/\/(?:api\.openai\.com|generativelanguage\.googleapis\.com|openrouter\.ai)\//,
    async (route) => {
      const request = route.request();
      if (!request.url().startsWith('https://api.openai.com/v1/images/')) {
        forbidden.push(request.url());
        await route.abort();
        return;
      }
      calls.push({
        url: request.url(),
        authorization: request.headers().authorization,
        contentType: request.headers()['content-type'] ?? '',
        body: request.postDataBuffer() ?? Buffer.alloc(0),
      });
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ b64_json: SAMPLE.toString('base64') }] }),
      });
    },
  );
  await page.goto('/generate');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    'content',
    /connect-src[^;]*https:\/\/api\.openai\.com/,
  );
  await selectOpenAI(page);
  await page.keyboard.press('Escape');
  await page.getByTestId('generate-prompt').fill('A red balloon over a quiet lake');
  await page.getByRole('button', { name: 'Generate Image', exact: true }).click();
  await expect(page).toHaveURL(/\/edit$/);
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe('https://api.openai.com/v1/images/generations');
  expect(calls[0].contentType).toContain('application/json');
  expect(JSON.parse(calls[0].body.toString())).toMatchObject({
    model: 'gpt-image-2.6-sunburst',
    prompt: expect.stringContaining('red balloon'),
  });
  const settings = await openSettings(page);
  await settings.getByTestId('openai-model-select').selectOption('gpt-image-2.6-flare');
  await page.keyboard.press('Escape');
  const editorImage = page.getByRole('img', { name: 'Current edited image', exact: true });
  const beforeEdit = await editorImage.getAttribute('src');
  await editorImage.click();
  await page
    .getByPlaceholder("e.g., 'change my shirt color to blue'", { exact: true })
    .fill('Change the balloon to blue');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect.poll(() => calls.length).toBe(2);
  await expect(editorImage).not.toHaveAttribute('src', beforeEdit!);
  await page.goto('/try-on');
  await page
    .getByTestId('tryon-person-input')
    .setInputFiles({ name: 'person.png', mimeType: 'image/png', buffer: SAMPLE });
  await page
    .getByTestId('tryon-clothing-input')
    .setInputFiles({ name: 'shirt.png', mimeType: 'image/png', buffer: SAMPLE });
  await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
  await expect.poll(() => calls.length).toBe(3);
  await expect(page.locator('img[src^="data:image/png"]')).toHaveCount(1);
  for (const [index, expectedImages] of [
    [1, 1],
    [2, 2],
  ]) {
    const call = calls[index];
    expect(call.url).toBe('https://api.openai.com/v1/images/edits');
    expect(call.contentType).toContain('multipart/form-data; boundary=');
    const body = call.body.toString('latin1');
    expect(body).toMatch(/name="model"\r\n\r\ngpt-image-2\.6-flare/);
    expect(body.match(/name="image(?:\[\])?"; filename=/g)).toHaveLength(expectedImages);
    expect(body).toContain('Content-Type: image/png');
  }
  expect(calls.every((call) => call.authorization === `Bearer ${KEY}`)).toBe(true);
  expect(forbidden).toEqual([]);
});
