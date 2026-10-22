/**
 * Finish README showcase: idphoto+print, editor mask, heroes (no-key notice), core-flow video.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:4175';
const OUT = path.join(ROOT, 'docs/showcase');
const ART = '/opt/cursor/artifacts';
const WIDTH = 1280;
const HEIGHT = 800;

await mkdir(OUT, { recursive: true });
await mkdir(ART, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function context(theme, { demo = true, record = false } = {}) {
  const opts = {
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    locale: 'en-US',
  };
  if (record) {
    opts.recordVideo = {
      dir: path.join(ART, 'readme-video-raw'),
      size: { width: WIDTH, height: HEIGHT },
    };
  }
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(
    ({ theme, demo }) => {
      localStorage.setItem('pixshop_theme', theme);
      if (demo) {
        localStorage.setItem('pixshop_image_provider', 'demo');
      } else {
        localStorage.removeItem('pixshop_image_provider');
      }
      sessionStorage.removeItem('pixshop_api_key');
      sessionStorage.removeItem('pixshop_openrouter_api_key');
      localStorage.removeItem('pixshop_api_key');
      localStorage.removeItem('pixshop_openrouter_api_key');
    },
    { theme, demo },
  );
  return ctx;
}

async function shot(page, name) {
  // Close any accidental dialogs
  const dialog = page.locator('[role="dialog"]');
  if (await dialog.count()) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);
  }
  const png = path.join(OUT, `${name}.png`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: png, fullPage: false });
  console.log('shot', png);
  return png;
}

// Heroes with Try-demo / API-key notice (not yet in demo mode) — viral first impression
for (const theme of ['bloom', 'night', 'newyear']) {
  const ctx = await context(theme, { demo: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page
    .getByTestId('api-key-notice')
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});
  await shot(page, `hero-${theme}`);
  await ctx.close();
}

// ID photo demo generate + print sheet actions
{
  const ctx = await context('newyear', { demo: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/idphoto`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('button', { name: /Generate ID Photo/i }).click();
  await page.waitForTimeout(2800);
  // Scroll result / print actions into view
  const print = page.getByRole('button', { name: /4×6|sheet \(JPG\)|sheet \(PDF\)|排版/i }).first();
  if (await print.count()) {
    await print.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await shot(page, 'idphoto-print-newyear');
  await ctx.close();
}

// Editor mask brush via demo sample CTA
{
  const ctx = await context('bloom', { demo: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  const sampleBtn = page.getByRole('button', { name: /Open editor with sample photo/i });
  if (await sampleBtn.isVisible().catch(() => false)) {
    await sampleBtn.click();
  } else {
    // Fallback: upload fixture without demo gate
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(path.join(ROOT, 'e2e/fixtures/sample.png'));
  }
  await page.waitForURL(/\/edit/, { timeout: 20000 });
  await page.waitForTimeout(700);
  const brushMode = page.getByRole('button', { name: /Brush mask|筆刷遮罩/i });
  if (await brushMode.count()) {
    await brushMode.click();
    await page.waitForTimeout(350);
  }
  const canvas = page.locator('canvas').last();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.35);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(
        box.x + box.width * (0.3 + i * 0.03),
        box.y + box.height * (0.35 + i * 0.02),
      );
    }
    await page.mouse.up();
  }
  await shot(page, 'editor-mask-bloom');
  await ctx.close();
}

// Core-flow video
{
  await mkdir(path.join(ART, 'readme-video-raw'), { recursive: true });
  const ctx = await context('bloom', { demo: false, record: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  await page.getByTestId('try-demo-button').click();
  await page.waitForTimeout(700);
  await page.goto(`${BASE}/idphoto`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Generate ID Photo/i }).click();
  await page.waitForTimeout(3000);
  // Try compare slider / before-after if present
  const compare = page.getByRole('button', { name: /Compare|比較/i }).first();
  if (await compare.count()) {
    await compare.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  // Nudge mouse across result image for motion
  const img = page.locator('img').nth(1);
  const ib = await img.boundingBox().catch(() => null);
  if (ib) {
    await page.mouse.move(ib.x + 20, ib.y + ib.height / 2);
    await page.mouse.move(ib.x + ib.width - 20, ib.y + ib.height / 2, { steps: 20 });
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(800);
  const video = page.video();
  await page.close();
  await ctx.close();
  if (video) {
    const rawPath = await video.path();
    await writeFile(path.join(ART, 'readme-core-flow-raw-path.txt'), `${rawPath}\n`);
    console.log('video', rawPath);
  }
}

await browser.close();
console.log('part2 done');
