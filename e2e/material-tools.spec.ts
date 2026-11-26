import { readFileSync, copyFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function seed(page: Page, theme = 'bloom') {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', selectedTheme);
  }, theme);
}

async function basket(page: Page) {
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  const direct = nav.getByRole('button', { name: /^(?:Basket|Material basket)(?:\s|$)/ });
  if (await direct.isVisible()) await direct.click();
  else {
    await nav.getByRole('button', { name: 'All photo tools', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'All photo tools', exact: true })
      .getByRole('button', { name: /^(?:Basket|Material basket)(?:\s|$)/ })
      .click();
  }
  const dialog = page.getByRole('dialog', { name: 'Material basket', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function assertAccessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(
    result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`material viewer tools and keyboard work in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await seed(page, theme);
      await page.goto('/materials/pose-hand-on-hip');
      const opener = page.getByRole('button', { name: 'View image', exact: true });
      await opener.click();
      const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
      await expect(viewer).toBeVisible();
      const image = viewer.getByTestId('material-viewer-image');
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      await viewer.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await viewer.getByRole('button', { name: 'Mirror image', exact: true }).click();
      await expect(
        viewer.getByRole('button', { name: 'Mirror image', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await viewer.getByRole('button', { name: 'Show composition grid', exact: true }).click();
      await expect(
        viewer.getByRole('button', { name: 'Show composition grid', exact: true }),
      ).toHaveAttribute('data-state', 'thirds');
      const gridBox = await viewer.getByTestId('material-viewer-grid').boundingBox();
      const imageBox = await image.boundingBox();
      expect(gridBox).not.toBeNull();
      expect(imageBox).not.toBeNull();
      for (const dimension of ['x', 'y', 'width', 'height'] as const) {
        expect(Math.abs(gridBox![dimension] - imageBox![dimension])).toBeLessThanOrEqual(2);
      }
      await viewer.getByRole('button', { name: 'Grayscale image', exact: true }).click();
      await expect(
        viewer.getByRole('button', { name: 'Grayscale image', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      const box = await viewer.getByTestId('material-viewer-stage').boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 25);
        await page.mouse.up();
      }
      await assertAccessible(page);
      await page.screenshot({
        path: `.taste-skill/shots/material-tools-viewer-${theme}-${width}.png`,
      });
      await viewer.getByRole('button', { name: 'Reset view', exact: true }).click();
      await expect(
        viewer.getByRole('button', { name: 'Mirror image', exact: true }),
      ).toHaveAttribute('aria-pressed', 'false');
      await expect(
        viewer.getByRole('button', { name: 'Grayscale image', exact: true }),
      ).toHaveAttribute('aria-pressed', 'false');
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        expect(
          await viewer.evaluate(
            (dialog) =>
              dialog.contains(document.activeElement) ||
              (document.activeElement === document.body && dialog.matches(':modal')),
          ),
        ).toBe(true);
      }
      await page.keyboard.press('Escape');
      await expect(viewer).not.toBeVisible();
      await expect(opener).toBeFocused();
    });
  }
}

test('material favorites and recent use persist independently of basket selections', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials');
  await page.getByTestId('favorite-material-white-oxford-shirt').click();
  await expect(page.getByTestId('favorite-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('heading', { name: 'Seated profile', exact: true }).click();
  await expect(page).toHaveURL(/\/materials\/pose-seated-profile$/);
  await expect(page.getByTestId('pose-metadata')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('bloom_material_preferences') ?? '{}').recentIds?.[0],
      ),
    )
    .toBe('pose-seated-profile');
  await page.goto('/materials');
  await page.getByTestId('materials-favorites-filter').click();
  await expect(page.locator('[data-testid^="basket-add-"]')).toHaveCount(1);
  await expect(page.getByTestId('basket-add-white-oxford-shirt')).toBeVisible();
  await page.getByTestId('materials-recent-filter').click();
  await expect(page.getByTestId('materials-favorites-filter')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByTestId('basket-add-pose-seated-profile')).toBeVisible();
  await page.reload();
  await page.getByTestId('materials-favorites-filter').click();
  await expect(page.getByTestId('favorite-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('bloom_material_preferences') ?? '{}'),
  );
  expect(saved.favoriteIds).toEqual(['white-oxford-shirt']);
  expect(saved.recentIds[0]).toBe('pose-seated-profile');
  const dialog = await basket(page);
  await expect(
    dialog.getByText('Your basket is empty. Choose references from the material library.'),
  ).toBeVisible();
});

test('malformed material preferences recover without breaking the material library', async ({
  page,
}) => {
  await seed(page);
  await page.addInitScript(() => localStorage.setItem('bloom_material_preferences', '{broken'));
  await page.goto('/materials');
  await expect(page.locator('[data-testid^="basket-add-"]')).toHaveCount(8);
  await page.getByTestId('favorite-material-white-oxford-shirt').click();
  await expect(page.getByTestId('favorite-material-white-oxford-shirt')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('command palette finds materials and invokes current tool commands by keyboard', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials');
  await page.getByLabel('Search materials', { exact: true }).focus();
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette', exact: true });
  await expect(palette).toBeVisible();
  const search = palette.getByLabel('Search commands', { exact: true });
  await expect(search).toBeFocused();
  await search.fill('Seated profile');
  await expect(
    palette.getByTestId('command-palette-result-material-pose-seated-profile'),
  ).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/materials\/pose-seated-profile$/);
  await expect(palette).not.toBeVisible();
  await page.goto('/try-on');
  await expect(page.getByRole('heading', { name: 'AI virtual try-on', exact: true })).toBeVisible();
  await page.keyboard.press('Control+k');
  await search.fill('Prompt');
  await palette.getByTestId('command-palette-result-workspace-tryon-prompt').click();
  await expect(page.getByRole('dialog', { name: 'Prompt', exact: true })).toBeVisible();
  await expect(palette).not.toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Prompt', exact: true })).not.toBeVisible();
});

test('mobile menu exposes command search and Escape restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/materials');
  await page.getByRole('button', { name: 'All photo tools', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'All photo tools', exact: true });
  await menu.getByRole('button', { name: 'Search tools and materials', exact: true }).click();
  const palette = page.getByRole('dialog', { name: 'Command palette', exact: true });
  await expect(palette).toBeVisible();
  await expect(menu).not.toBeVisible();
  await assertAccessible(page);
  await page.screenshot({ path: '.taste-skill/shots/material-tools-palette-390.png' });
  await page.keyboard.press('Escape');
  await expect(palette).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'All photo tools', exact: true })).toBeFocused();
});

test('reference board downloads a populated PNG and empty basket cannot export', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/materials');
  for (const id of ['pose-hand-on-hip', 'white-oxford-shirt', 'lighting-soft-window']) {
    await page.getByTestId(`basket-add-${id}`).click();
  }
  const dialog = await basket(page);
  const downloadEvent = page.waitForEvent('download');
  await dialog.getByTestId('material-board-export').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^bloomrender-reference-board-.*\.png$/);
  const file = await download.path();
  expect(file).not.toBeNull();
  const png = readFileSync(file!);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(1000);
  expect(png.readUInt32BE(20)).toBeGreaterThan(300);
  const pixelColors = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, 128, 128);
    const data = context.getImageData(0, 0, 128, 128).data;
    const colors = new Set<string>();
    for (let i = 0; i < data.length; i += 4) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    return colors.size;
  }, png.toString('base64'));
  expect(pixelColors).toBeGreaterThan(30);
  copyFileSync(file!, '/tmp/bloomrender-material-board-review.png');
  await dialog.getByRole('button', { name: 'Clear basket', exact: true }).click();
  await expect(dialog.getByTestId('material-board-export')).toBeDisabled();
});

test('board export reports failed material loads and permits retry', async ({ page }) => {
  await seed(page);
  await page.goto('/materials');
  await page.getByTestId('basket-add-white-oxford-shirt').click();
  const dialog = await basket(page);
  await page.route('**/images/tryon-materials/white-oxford-shirt.svg', (route) => route.abort());
  await dialog.getByTestId('material-board-export').click();
  await expect(dialog.getByTestId('material-board-status')).toContainText(
    /could not|failed|unable/i,
  );
  await expect(dialog.getByTestId('material-board-export')).toBeEnabled();
  await page.unroute('**/images/tryon-materials/white-oxford-shirt.svg');
  const downloadEvent = page.waitForEvent('download');
  await dialog.getByTestId('material-board-export').click();
  const download = await downloadEvent;
  expect(await download.failure()).toBeNull();
});

test('closing a picker image viewer restores the reference library underneath', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/try-on');
  await expect(page.getByRole('heading', { name: 'AI virtual try-on', exact: true })).toBeVisible();
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette', exact: true });
  await palette.getByLabel('Search commands', { exact: true }).fill('Reference library');
  await palette.getByTestId('command-palette-result-workspace-tryon-materials').click();
  const library = page.getByRole('dialog', { name: 'Reference library', exact: true });
  await expect(library).toBeVisible();
  const opener = library.getByRole('button', { name: /View.*image|View image/i }).first();
  await opener.click();
  const viewer = page.getByRole('dialog', { name: 'Material viewer', exact: true });
  await expect(viewer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(library).toBeVisible();
  await expect(opener).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(library).not.toBeVisible();
});

for (const theme of ['night', 'newyear']) {
  test(`board PNG preserves the ${theme} accent and localized labels`, async ({ page }) => {
    await seed(page, theme);
    await page.addInitScript(() => localStorage.setItem('bloom_language', 'zh-TW'));
    await page.goto('/materials');
    await page.getByTestId('basket-add-pose-hand-on-hip').click();
    await page.getByRole('button', { name: /^素材籃 \(/ }).click();
    const dialog = page.getByRole('dialog', { name: '素材籃', exact: true });
    const downloadEvent = page.waitForEvent('download');
    await dialog.getByTestId('material-board-export').click();
    const file = await (await downloadEvent).path();
    const png = readFileSync(file!);
    const accentPixels = await page.evaluate(async (base64) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      context.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-accent')
        .trim();
      context.fillRect(0, 0, 1, 1);
      const expected = context.getImageData(0, 0, 1, 1).data;
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let matches = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === expected[0] && data[i + 1] === expected[1] && data[i + 2] === expected[2])
          matches++;
      }
      return matches;
    }, png.toString('base64'));
    expect(accentPixels).toBeGreaterThan(50);
    if (theme === 'newyear') copyFileSync(file!, '/tmp/bloomrender-material-board-zh-newyear.png');
  });
}
