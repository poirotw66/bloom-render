import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const STUDIES = [
  { id: 'hand-on-hip-study', posture: 'standing', theme: 'night' },
  { id: 'seated-study', posture: 'seated', theme: 'bloom' },
];

async function seed(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
  }, theme);
}

async function library(page: Page) {
  await expect(page.getByRole('heading', { name: 'AI virtual try-on', exact: true })).toBeVisible();
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette', exact: true });
  await palette.getByLabel('Search commands', { exact: true }).fill('Reference library');
  await palette.getByTestId('command-palette-result-workspace-tryon-materials').click();
  const dialog = page.getByRole('dialog', { name: 'Reference library', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const study of STUDIES) {
  for (const width of [390, 1440]) {
    test(`${study.id} keeps its camera and pair aligned at ${width}px`, async ({ page }) => {
      await seed(page, study.theme);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(`/materials/${study.id}-front-lineart`);
      const views = page.getByTestId('pose-view-select');
      await expect(views.locator('option')).toHaveCount(4);
      await views.selectOption('profile');
      await page.getByTestId('pose-representation-select').selectOption('depth');
      await expect(page).toHaveURL(new RegExp(`/materials/${study.id}-profile-depth$`));
      await expect(page.getByTestId('pose-metadata')).toContainText(new RegExp(study.posture, 'i'));
      await page.getByRole('button', { name: 'View image', exact: true }).click();
      const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
      await viewer.getByTestId('pose-compare-toggle').click();
      await expect(viewer.getByTestId('pose-comparison')).toBeVisible();
      await expect(viewer.getByTestId('pose-comparison')).toHaveAttribute(
        'data-pair-id',
        `${study.id}-profile`,
      );
      const primary = viewer.getByTestId('material-viewer-image');
      const depth = viewer.getByTestId('pose-comparison-depth-image');
      await expect(primary).toHaveAttribute(
        'src',
        new RegExp(`${study.id}-profile-lineart\\.png$`),
      );
      await expect(depth).toHaveAttribute('src', new RegExp(`${study.id}-profile-depth\\.png$`));
      await expect
        .poll(() => primary.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBe(512);
      await expect
        .poll(() => depth.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBe(512);
      const first = await primary.boundingBox();
      const second = await depth.boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      for (const dimension of ['x', 'y', 'width', 'height'] as const)
        expect(Math.abs(first![dimension] - second![dimension])).toBeLessThanOrEqual(2);
      const slider = viewer.getByTestId('pose-comparison-slider');
      await slider.press('Home');
      await expect(slider).toHaveValue('0');
      await slider.press('End');
      await expect(slider).toHaveValue('100');
      await slider.click();
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: `.taste-skill/shots/${study.id}-${width}.png` });
      await page.keyboard.press('Escape');
      await expect(viewer).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'View image', exact: true })).toBeFocused();
    });
  }

  test(`MCP keeps ${study.id} isolated and opens its exact browser recipe`, async ({
    page,
    baseURL,
  }) => {
    await seed(page);
    const client = new Client({ name: 'pose-library-browser-test', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL('../mcp/server.mjs', import.meta.url))],
      env: { BLOOMRENDER_SITE_URL: `${baseURL}/` },
      stderr: 'pipe',
    });
    try {
      await client.connect(transport);
      const search = await client.callTool({
        name: 'bloomrender_search_references',
        arguments: { groupId: study.id, representation: 'depth', language: 'en' },
      });
      expect(search.isError).not.toBe(true);
      const listing = search.structuredContent as {
        total: number;
        items: Array<{
          id: string;
          pose: { groupId: string; posture: string };
          poseAlternatives: Array<{ id: string }>;
        }>;
      };
      expect(listing.total).toBe(4);
      expect(
        listing.items.every(
          (item) => item.pose.groupId === study.id && item.pose.posture === study.posture,
        ),
      ).toBe(true);
      for (const item of listing.items) {
        expect(item.poseAlternatives).toHaveLength(4);
        expect(
          item.poseAlternatives.every((alternative) => alternative.id.startsWith(`${study.id}-`)),
        ).toBe(true);
      }
      const chosen = `${study.id}-profile-depth`;
      const composed = await client.callTool({
        name: 'bloomrender_compose_brief',
        arguments: { materialIds: ['white-oxford-shirt', chosen], language: 'en' },
      });
      expect(composed.isError).not.toBe(true);
      const composition = composed.structuredContent as {
        recipeUrl: string;
        recipe: { v: number; materialIds: string[] };
        brief: string;
      };
      expect(composition.recipe).toMatchObject({
        v: 1,
        materialIds: ['white-oxford-shirt', chosen],
      });
      expect(composition.brief).toContain(`posture=${study.posture}`);
      await page.goto(composition.recipeUrl);
      const picker = await library(page);
      await expect(picker.getByTestId(`tryon-material-${chosen}`)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(picker.getByTestId('pose-view-select')).toHaveValue('profile');
      await expect(picker.getByTestId('pose-representation-select')).toHaveValue('depth');
    } finally {
      await client.close();
    }
  });
}
