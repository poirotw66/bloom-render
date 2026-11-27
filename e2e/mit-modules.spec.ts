import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openWorkspace } from './helpers/workspace';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));

async function seed(page: Page, theme = 'bloom', clipboard = true) {
  await page.addInitScript(
    ({ theme, clipboard }) => {
      localStorage.setItem('bloom_language', 'en');
      localStorage.setItem('bloom_theme', theme);
      localStorage.setItem('bloom_image_provider', 'openrouter');
      sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-not-for-sharing');
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            if (!clipboard) throw new DOMException('Denied', 'NotAllowedError');
            (window as Window & { copied?: string }).copied = text;
          },
        },
      });
    },
    { theme, clipboard },
  );
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
}

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`MIT palette extracts original colors and supports keyboard copying in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await seed(page, theme);
      await page.goto('/materials/navy-tailored-jacket');
      await page.getByRole('button', { name: 'View image', exact: true }).click();
      const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
      const palette = viewer.getByRole('region', { name: 'Extracted colors', exact: true });
      await expect(palette).toBeVisible();
      const swatches = palette.getByRole('button', { name: /^Copy color #[\dA-F]{6}$/ });
      const colors = await swatches.allTextContents();
      expect(colors.length).toBeGreaterThanOrEqual(2);
      expect(colors.length).toBeLessThanOrEqual(5);
      await swatches.first().press('Enter');
      await expect
        .poll(() => page.evaluate(() => (window as Window & { copied?: string }).copied))
        .toBe(colors[0].trim());
      await viewer.getByRole('button', { name: 'Grayscale image', exact: true }).click();
      expect(await swatches.allTextContents()).toEqual(colors);
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        accessibility.violations.filter((item) =>
          ['serious', 'critical'].includes(item.impact ?? ''),
        ),
      ).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: `.taste-skill/shots/mit-palette-${theme}-${width}.png` });
      await page.keyboard.press('Escape');
      await page.goto('/materials/pose-hand-on-hip');
      await page.getByRole('button', { name: 'View image', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Extracted colors', exact: true })).toHaveCount(
        0,
      );
    });
  }
}

test('HEX copying remains usable when clipboard permission is denied', async ({ page }) => {
  await seed(page, 'bloom', false);
  await page.goto('/materials/terracotta-midi-dress');
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const palette = page.getByRole('region', { name: 'Extracted colors', exact: true });
  const swatch = palette.getByRole('button', { name: /^Copy color #[\dA-F]{6}$/ }).first();
  await expect(swatch).toBeVisible();
  const color = (await swatch.textContent())!.trim();
  await swatch.click();
  await expect(palette.getByRole('textbox', { name: 'Color code', exact: true })).toHaveValue(
    color,
  );
  await expect(palette.getByRole('status')).toContainText(/copy/i);
});

test('reference brief preserves actual image order without sharing private inputs or changing manual prompts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await seed(page);
  await page.goto('/try-on');
  await page.getByTestId('tryon-person-input').setInputFiles({
    name: 'private-person-do-not-share.png',
    mimeType: 'image/png',
    buffer: SAMPLE,
  });
  const library = await openWorkspace(page, 'Reference library');
  for (const id of ['navy-tailored-jacket', 'seated-study-front-lineart']) {
    await library.getByTestId(`tryon-material-${id}`).click();
    await expect(library.getByTestId(`tryon-material-${id}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  await page.keyboard.press('Escape');
  await page.getByText('Advanced settings and references', { exact: true }).click();
  await page.getByText('Upload extra references (optional)', { exact: true }).click();
  await page.getByTestId('tryon-reference-lighting').setInputFiles({
    name: 'private-light-do-not-share.png',
    mimeType: 'image/png',
    buffer: SAMPLE,
  });
  const prompt = await openWorkspace(page, 'Prompt');
  const manual = 'Preserve identity and follow the selected seated pose and jacket.';
  await prompt.getByTestId('tryon-prompt-mode').selectOption('manual');
  await prompt.getByTestId('tryon-prompt').fill(manual);
  await prompt.getByRole('button', { name: 'Copy prompt', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { copied?: string }).copied))
    .toBe(manual);
  await prompt.getByRole('button', { name: 'Copy reference brief', exact: true }).click();
  const brief = await page.evaluate(() => (window as Window & { copied?: string }).copied!);
  expect(brief.startsWith(manual + '\n\n')).toBe(true);
  const slots = brief.split('\n').filter((line) => /^- Image \d+/.test(line));
  expect(slots).toHaveLength(4);
  expect(slots[0]).toContain('Image 1 · Attach this local image separately.');
  expect(slots[1]).toContain('Image 2 · Clothing');
  expect(slots[1]).toContain(
    'https://www.bloss0m.com/bloom-render/images/tryon-materials/navy-tailored-jacket.svg',
  );
  expect(slots[2]).toContain('Image 3 · Pose');
  expect(slots[2]).toContain('seated-study-front-lineart.png');
  expect(slots[3]).toContain('Image 4 · Attach this local image separately.');
  expect(brief).not.toMatch(/private-person|private-light|mock-key-not-for-sharing|blob:|data:/);
  await expect(prompt.getByTestId('tryon-prompt')).toHaveValue(manual);
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException('Denied', 'NotAllowedError');
        },
      },
    }),
  );
  await prompt.getByRole('button', { name: 'Copy reference brief', exact: true }).click();
  await expect(prompt.getByRole('textbox', { name: 'Reference brief', exact: true })).toHaveValue(
    brief,
  );
  await page.screenshot({ path: '.taste-skill/shots/mit-reference-brief-390.png' });
});

test('full upstream MIT notice ships in the build and is reachable from settings', async ({
  page,
  request,
}) => {
  await seed(page);
  await page.goto('/try-on');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  const notice = settings.getByRole('link', { name: 'Open-source module license', exact: true });
  await notice.scrollIntoViewIfNeeded();
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('href', /\/licenses\/posewear-MIT\.txt$/);
  const response = await request.get((await notice.getAttribute('href'))!);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toBe(
    readFileSync(new URL('../public/licenses/posewear-MIT.txt', import.meta.url), 'utf8'),
  );
  expect(await response.text()).toContain('Copyright (c) 2026 PoseWear contributors');
  expect(readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8')).toContain(
    'licenses/posewear-MIT.txt',
  );
});
