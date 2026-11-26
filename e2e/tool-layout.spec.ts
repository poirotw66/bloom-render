import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const MATERIAL_COUNT = JSON.parse(
  readFileSync(new URL('../constants/tryOnMaterials.json', import.meta.url), 'utf8'),
).length as number;

async function openTryOn(page: Page, theme = 'bloom') {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', selectedTheme);
    localStorage.setItem('bloom_image_provider', 'openrouter');
    sessionStorage.setItem('bloom_openrouter_api_key', 'mock-key-never-sent');
  }, theme);
  await page.route('https://openrouter.ai/**', (route) => route.abort());
  await page.route('https://generativelanguage.googleapis.com/**', (route) => route.abort());
  await page.goto('/try-on');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function openWorkspace(page: Page, name: string) {
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

for (const width of [390, 1440]) {
  test(`viewport workspace keeps generation and comparison reachable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await openTryOn(page);
    const workspace = page.locator('.tryon-workspace');
    const bounds = await workspace.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(-1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(845);
    expect(bounds!.height).toBeGreaterThanOrEqual(843);

    const studio = page.locator('.tryon-studio');
    const generate = page.getByRole('button', { name: 'Generate Try-On', exact: true });
    await generate.scrollIntoViewIfNeeded();
    await expect(generate).toBeInViewport({ ratio: 1 });
    if (width === 390)
      expect(await studio.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    const slider = page.getByRole('slider');
    await slider.scrollIntoViewIfNeeded();
    await expect(slider).toBeInViewport({ ratio: 1 });
    await slider.focus();
    await slider.press('End');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('[data-moment="cursor-spotlight"]')).toHaveAttribute(
      'data-moment-mounted',
      '1',
    );
    await expect(page.locator('[data-moment-failed]')).toHaveCount(0);
  });
}

test('reduced motion keeps the mounted spotlight static and the workspace usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTryOn(page);
  const workspace = page.locator('[data-moment="cursor-spotlight"]');
  await expect(workspace).toHaveAttribute('data-moment-mounted', '1');
  await expect(workspace).toHaveAttribute('data-moment-still', 'reduced');
  await expect(workspace.locator('.mo-cs__light')).toHaveCount(1);
  await expect(workspace).toHaveCSS('--mo-x', '72.00%');
  await page.mouse.move(100, 300);
  await page.mouse.move(900, 500);
  await expect(workspace).toHaveCSS('--mo-x', '72.00%');
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
  await expect(page.locator('[data-moment-failed]')).toHaveCount(0);
});

test('client navigation cleans up the spotlight and mounts the homepage moment again', async ({
  page,
}) => {
  await openTryOn(page);
  const workspace = page.locator('[data-moment="cursor-spotlight"]');
  await expect(workspace).toHaveAttribute('data-moment-mounted', '1');
  const previousWorkspace = await workspace.elementHandle();
  await page
    .getByRole('navigation', { name: 'Primary', exact: true })
    .getByRole('link', { name: 'BloomRender' })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.home-main [data-moment="liquid-hover"]')).toHaveAttribute(
    'data-moment-mounted',
    '1',
  );
  await expect(page.locator('.mo-cs__light')).toHaveCount(0);
  expect(
    await previousWorkspace!.evaluate((element) => element.querySelector('.mo-cs__light')),
  ).toBeNull();
  await page.goBack();
  await expect(workspace).toHaveAttribute('data-moment-mounted', '1');
  await expect(workspace.locator('.mo-cs__light')).toHaveCount(1);
  await page.goForward();
  await expect(page.locator('.home-main [data-moment="liquid-hover"]')).toHaveAttribute(
    'data-moment-mounted',
    '1',
  );
  await expect(page.locator('[data-moment-failed], .mo-cs__light')).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`workspace dialogs retain focus and restore it on Escape at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await openTryOn(page);
    for (const name of ['Reference library', 'Recipes', 'Draft']) {
      const dialog = await openWorkspace(page, name);
      await expect
        .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
        .toBe(true);
      await expect(page.getByRole('dialog', { name: 'All photo tools', exact: true })).toHaveCount(
        0,
      );
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect
        .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
        .toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
      await expect(
        nav.getByRole('button', { name: width === 390 ? 'All photo tools' : name, exact: true }),
      ).toBeFocused();
    }
  });
}

test('first-time mobile visitors can open both file pickers by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_theme', 'bloom');
  });
  await page.goto('/try-on');
  await expect(page.getByTestId('api-key-notice')).toBeVisible();
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
    .violations;
  expect(
    violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')),
  ).toEqual([]);
  const photo = {
    name: 'input.png',
    mimeType: 'image/png',
    buffer: readFileSync(new URL('./fixtures/sample.png', import.meta.url)),
  };
  for (const name of ['Your Photo', 'Add']) {
    const button =
      name === 'Your Photo'
        ? page.getByTestId('tryon-person-input')
        : page.getByRole('button', { name, exact: true });
    await expect(button).toBeEnabled();
    const choosing = page.waitForEvent('filechooser');
    await button.press('Enter');
    await (await choosing).setFiles(photo);
    await expect(
      page.getByRole('img', { name: name === 'Your Photo' ? 'Person' : 'Clothing 1', exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole('img', { name: 'Person', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Clothing 1', exact: true })).toBeVisible();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`try-on navigation and references fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await openTryOn(page);
    const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
    await expect(nav.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
    await expect(
      nav.getByRole('button', { name: 'Generation History', exact: true }),
    ).toBeVisible();

    const navigationProblems = await nav.evaluate((element) => {
      const problems: string[] = [];
      const bounds = element.getBoundingClientRect();
      for (const control of element.querySelectorAll<HTMLElement>('button, a[href]')) {
        const rect = control.getBoundingClientRect();
        const style = getComputedStyle(control);
        if (!rect.width || !rect.height || style.visibility === 'hidden') continue;
        const label =
          control.getAttribute('aria-label') || control.textContent?.trim() || control.tagName;
        if (rect.width < 43.5 || rect.height < 43.5)
          problems.push(`${label}: target ${rect.width}×${rect.height}`);
        if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)
          problems.push(`${label}: clipped horizontally`);
        if (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)
          problems.push(`${label}: clipped vertically`);
      }
      return problems;
    });
    expect(navigationProblems).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);

    await openWorkspace(page, 'Reference library');
    const materialImages = page.getByTestId(/^tryon-material-/).locator('img');
    await expect(materialImages).toHaveCount(MATERIAL_COUNT);
    await expect
      .poll(() =>
        materialImages.evaluateAll(
          (images) =>
            images.filter(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ).length,
        ),
      )
      .toBe(MATERIAL_COUNT);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
}

test('mobile tools menu exposes language, restores focus and opens the material library', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTryOn(page);
  const trigger = page.getByRole('button', { name: 'All photo tools', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'All photo tools', exact: true });
  await expect(dialog).toBeVisible();
  await expect(
    dialog
      .getByRole('group', { name: 'Language', exact: true })
      .getByRole('button', { name: 'EN', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole('link', { name: 'Reference materials', exact: true }).click();
  await expect(page).toHaveURL(/\/materials$/);
  await expect(
    page.getByRole('heading', { name: 'Try-on reference materials', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generation History', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Generation History', exact: true })).toBeVisible();
});

test('optional reference uploads have visible, accessible role labels', async ({ page }) => {
  await openTryOn(page);
  const details = page.getByTestId('tryon-reference-pose').locator('xpath=ancestor::details[1]');
  if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  for (const role of ['pose', 'expression', 'scene', 'lighting']) {
    const input = page.getByTestId(`tryon-reference-${role}`);
    await expect(input).toBeVisible();
    await expect(input).toHaveAccessibleName(`Upload ${role} reference`);
  }
});

for (const theme of ['bloom', 'night', 'newyear']) {
  for (const width of [390, 1440]) {
    test(`${theme} try-on has no serious or critical accessibility violations at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await openTryOn(page, theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
        .analyze();
      const problems = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);
    });
  }
}
