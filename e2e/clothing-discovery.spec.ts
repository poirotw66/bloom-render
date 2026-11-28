import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openWorkspace } from './helpers/workspace';
import { MATERIAL_CLOTHING_COUNT } from './helpers/materials';

async function seed(page: Page, theme = 'bloom') {
  await page.addInitScript((theme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', theme);
  }, theme);
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    (route) => route.abort(),
  );
}

test('catalog clothing categories and bilingual terms narrow results without changing the basket', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials/white-crew-neck-tee');
  await page.getByTestId('basket-add-white-crew-neck-tee').click();
  await page.goto('/materials');
  await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('clothing');
  const category = page.getByRole('combobox', { name: 'Clothing category', exact: true });
  await category.selectOption('skirt');
  await expect(page.locator('article[data-material-group]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Batch selection', exact: true }).click();
  await page.getByRole('button', { name: 'Select visible', exact: true }).click();
  await expect(page.getByTestId('material-batch-toolbar')).toContainText('3 selected');
  await category.selectOption('top');
  await expect(page.locator('article[data-material-group]')).toHaveCount(19);
  await expect(page.getByTestId('material-batch-toolbar')).toContainText('0 selected');
  const search = page.getByRole('searchbox', { name: 'Search materials', exact: true });
  await search.fill('白色 上衣');
  await expect(page.locator('article[data-material-group="white-crew-neck-tee"]')).toBeVisible();
  await expect(page.locator('article[data-material-group="navy-tailored-jacket"]')).toHaveCount(0);
  await search.fill('');
  await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('pose');
  await expect(category).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Material type', exact: true }).selectOption('clothing');
  await expect(category).toHaveValue('');
  await expect(page.locator('article[data-material-group]')).toHaveCount(MATERIAL_CLOTHING_COUNT);
  await search.fill('no-matching-garment-999');
  await expect(page.locator('article[data-material-group]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('article[data-material-group]')).toHaveCount(MATERIAL_CLOTHING_COUNT);
  await category.selectOption('outerwear');
  await search.fill('white');
  const suggestions = page.getByTestId('material-search-suggestions');
  await expect(suggestions.getByRole('button', { name: /^white crew-neck tee$/i })).toHaveCount(0);
  await suggestions.getByRole('button', { name: /^white cropped jacket$/i }).click();
  await expect(page.locator('article[data-material-group]')).toHaveCount(1);
  await expect(page.locator('article[data-material-group="white-cropped-jacket"]')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('bloom_material_basket') ?? '{}').materialBasket
          ?.materialIds,
    ),
  ).toEqual(['white-crew-neck-tee']);
});

test('try-on category and search filters preserve chosen garments and the exact pose', async ({
  page,
}) => {
  await seed(page);
  const ids = ['white-crew-neck-tee', 'pose-full-single-p061'];
  for (const id of ids) {
    await page.goto(`/materials/${id}`);
    await page.getByTestId(`basket-add-${id}`).click();
  }
  const basket = await openWorkspace(page, 'Material basket');
  await basket.getByRole('button', { name: 'Use in try-on', exact: true }).click();
  const library = await openWorkspace(page, 'Reference library');
  await library.getByRole('button', { name: 'Clothing', exact: true }).click();
  const category = library.getByRole('combobox', { name: 'Clothing category', exact: true });
  await category.selectOption('outerwear');
  await expect(library.getByTestId(/^tryon-material-/)).toHaveCount(11);
  await library.getByTestId('tryon-material-navy-tailored-jacket').click();
  await expect(library.getByTestId('tryon-material-navy-tailored-jacket')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await category.selectOption('top');
  const search = library.getByRole('searchbox', { name: 'Search references', exact: true });
  await search.fill('白色 上衣');
  await expect(library.getByTestId('tryon-material-white-crew-neck-tee')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await search.fill('');
  await library.getByRole('button', { name: 'Pose', exact: true }).click();
  await library.getByRole('combobox', { name: 'Posture', exact: true }).selectOption('squatting');
  await expect(library.getByTestId('tryon-material-pose-full-single-p061')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await library.getByRole('button', { name: 'Clothing', exact: true }).click();
  await expect(category).toHaveValue('');
  for (const id of ['white-crew-neck-tee', 'navy-tailored-jacket'])
    await expect(library.getByTestId(`tryon-material-${id}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
});

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`${theme} clothing filter is accessible at ${width}px`, async ({ page }) => {
      await seed(page, theme);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/materials');
      await page
        .getByRole('combobox', { name: 'Material type', exact: true })
        .selectOption('clothing');
      const category = page.getByRole('combobox', { name: 'Clothing category', exact: true });
      await category.selectOption('dress');
      await expect(page.locator('article[data-material-group]')).toHaveCount(9);
      await expect
        .poll(() =>
          page
            .locator('article[data-material-group] img')
            .first()
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
      if (width === 390) {
        const image = await page.locator('article[data-material-group] img').first().boundingBox();
        expect(image).not.toBeNull();
        expect(image!.y).toBeLessThan(660);
      }
      await category.focus();
      await expect(category).toBeFocused();
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `.taste-skill/shots/clothing-discovery-${theme}-${width}.png`,
      });
    });
  }
}
