import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openWorkspace } from './helpers/workspace';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));

test('pose selection groups actions and applies the exact chosen camera and representation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('bloom_language', 'en'));
  await page.goto('/try-on');
  await page.getByRole('button', { name: 'Choose pose', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Reference library', exact: true });
  await expect(picker.locator('[data-material-group]')).toHaveCount(6);
  const seated = picker.locator('[data-material-group="seated-study:seated:eye-level:full-body"]');
  await seated.getByRole('button', { name: 'Back', exact: true }).click();
  await seated.locator('summary').click();
  await seated
    .getByRole('combobox', { name: 'Reference representation', exact: true })
    .selectOption('seated-study-back-depth');
  const selected = seated.getByTestId('tryon-material-seated-study-back-depth');
  await expect(selected).toHaveAttribute('aria-pressed', 'false');
  await selected.click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  const board = page.getByTestId('tryon-reference-board');
  await expect(board.locator('img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Choose pose', exact: true }).click();
  await expect(picker.getByTestId('pose-view-select')).toHaveValue('back');
  await expect(picker.getByTestId('pose-representation-select')).toHaveValue('depth');
});

test('try-on reviews current inputs and keeps a completed result while editing and retrying', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-studio-key-never-sent');
  });
  const requests: unknown[] = [];
  await page.route('https://openrouter.ai/api/v1/images', async (route) => {
    requests.push(route.request().postDataJSON());
    const failed = requests.length === 2;
    await route.fulfill({
      status: failed ? 400 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        failed
          ? { error: { message: 'Invalid request' } }
          : {
              data: [{ b64_json: SAMPLE.toString('base64'), media_type: 'image/png' }],
            },
      ),
    });
  });
  await page.goto('/try-on');
  const board = page.getByTestId('tryon-reference-board');
  await expect(board).toBeVisible();
  await expect(board.locator('img')).toHaveCount(0);
  await page.getByTestId('tryon-person-input').setInputFiles({
    name: 'fixture-person.png',
    mimeType: 'image/png',
    buffer: SAMPLE,
  });
  const chooseMaterial = async (id: string) => {
    const picker = await openWorkspace(page, 'Reference library');
    const material = picker.getByTestId(`tryon-material-${id}`);
    await material.click();
    await expect(material).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
  };
  await chooseMaterial('white-oxford-shirt');
  await expect(board.locator('img')).toHaveCount(2);
  const generate = page.getByRole('button', { name: 'Generate Try-On', exact: true });
  await generate.click();
  const completed = page.locator('.tryon-result-image img[src^="data:image/png"]');
  await expect(completed).toBeVisible();
  const firstResult = await completed.getAttribute('src');
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  await chooseMaterial('navy-tailored-jacket');
  await expect(completed).toHaveAttribute('src', firstResult!);
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByRole('button', { name: 'Retry 1 failed', exact: true })).toBeVisible();
  await expect(completed).toHaveAttribute('src', firstResult!);
  expect(requests).toHaveLength(2);
  expect(requests[1]).not.toEqual(requests[0]);
  await chooseMaterial('terracotta-midi-dress');
  await page.getByRole('button', { name: 'Retry 1 failed', exact: true }).click();
  await expect.poll(() => requests.length).toBe(3);
  expect(requests[2]).toEqual(requests[1]);
  await expect(completed).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Retry 1 failed', exact: true })).toHaveCount(0);
});
