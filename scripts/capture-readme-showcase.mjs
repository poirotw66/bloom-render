/**
 * Capture README showcase screenshots + core-flow video (demo mode, no API keys).
 * Usage: node scripts/capture-readme-showcase.mjs [--base http://127.0.0.1:4175]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:4175';
const OUT = path.join(ROOT, 'docs/showcase');
const ART = '/opt/cursor/artifacts';
const SAMPLE = path.join(ROOT, 'e2e/fixtures/sample.png');
const WIDTH = 1280;
const HEIGHT = 800;

await mkdir(OUT, { recursive: true });
await mkdir(ART, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function primedContext(theme, { record = false } = {}) {
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
  const context = await browser.newContext(opts);
  await context.addInitScript((t) => {
    localStorage.setItem('bloom_theme', t);
    localStorage.setItem('bloom_image_provider', 'demo');
    localStorage.setItem('bloom_background_motion', 'false');
    sessionStorage.removeItem('bloom_api_key');
    sessionStorage.removeItem('bloom_openrouter_api_key');
    localStorage.removeItem('bloom_api_key');
    localStorage.removeItem('bloom_openrouter_api_key');
  }, theme);
  return context;
}

async function shot(page, name) {
  const png = path.join(OUT, `${name}.png`);
  await page.waitForTimeout(450);
  await page.screenshot({ path: png, fullPage: false });
  console.log('shot', png);
  return png;
}

// --- Static showcase shots ---
{
  const shots = [
    { theme: 'bloom', slug: 'hero-bloom', path: '/' },
    { theme: 'night', slug: 'hero-night', path: '/' },
    { theme: 'newyear', slug: 'hero-newyear', path: '/' },
    { theme: 'night', slug: 'generate-night', path: '/generate' },
    { theme: 'bloom', slug: 'photography-service-bloom', path: '/photography-service' },
    { theme: 'night', slug: 'enhance-night', path: '/enhance' },
    { theme: 'bloom', slug: 'prompt-gallery-bloom', path: '/prompt-gallery' },
  ];

  for (const s of shots) {
    const ctx = await primedContext(s.theme);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle', timeout: 60000 });
    await shot(page, s.slug);
    await ctx.close();
  }
}

// ID photo: demo generate → print sheet controls
{
  const ctx = await primedContext('newyear');
  const page = await ctx.newPage();
  await page.goto(`${BASE}/idphoto`, { waitUntil: 'networkidle', timeout: 60000 });
  // Ensure demo is on (init script) — click Generate with sample if needed
  const generate = page.getByRole('button', { name: /Generate|生成/i }).first();
  if (await generate.isVisible().catch(() => false)) {
    await generate.click();
    await page.waitForTimeout(2500);
  }
  // Prefer a view showing print sheet actions
  const printBtn = page.getByRole('button', { name: /4×6|print|排版|sheet/i }).first();
  if (await printBtn.isVisible().catch(() => false)) {
    await printBtn.scrollIntoViewIfNeeded().catch(() => {});
  }
  await shot(page, 'idphoto-print-newyear');
  await ctx.close();
}

// Editor + mask brush
{
  const ctx = await primedContext('bloom');
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  const fileInput = page.locator('#image-upload-start');
  await fileInput.setInputFiles(SAMPLE);
  await page.waitForURL(/\/edit/, { timeout: 15000 });
  await page.waitForTimeout(600);
  // Switch to brush mode if available
  const brush = page.getByRole('button', { name: /Brush|筆刷|mask/i }).first();
  if (await brush.isVisible().catch(() => false)) {
    await brush.click();
    await page.waitForTimeout(300);
  } else {
    // Try radio / tab labelled Brush inside retouch
    const brushAlt = page
      .locator('button, [role="radio"], label')
      .filter({ hasText: /Brush|筆刷/i })
      .first();
    if (await brushAlt.count()) await brushAlt.click().catch(() => {});
  }
  // Draw a short stroke on canvas
  const canvas = page.locator('canvas').first();
  if (await canvas.count()) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.4);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55, { steps: 12 });
      await page.mouse.up();
    }
  }
  await shot(page, 'editor-mask-bloom');
  await ctx.close();
}

// --- Core flow video (home → try demo / idphoto generate → result) ---
{
  await mkdir(path.join(ART, 'readme-video-raw'), { recursive: true });
  const ctx = await primedContext('bloom', { record: true });
  // Fresh visitor then enable demo via button for narrative
  await ctx.addInitScript(() => {
    localStorage.removeItem('bloom_image_provider');
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  const tryDemo = page.getByTestId('try-demo-button');
  if (await tryDemo.isVisible().catch(() => false)) {
    await tryDemo.click();
    await page.waitForTimeout(600);
  }
  await page.goto(`${BASE}/idphoto`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  const gen = page.getByRole('button', { name: /Generate|生成/i }).first();
  if (await gen.isVisible().catch(() => false)) {
    await gen.click();
    await page.waitForTimeout(2800);
  }
  // Hover compare / scroll to result
  const compare = page.getByRole('button', { name: /Compare|比較|Before/i }).first();
  if (await compare.isVisible().catch(() => false)) {
    await compare.click().catch(() => {});
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(700);
  const video = page.video();
  await ctx.close();
  if (video) {
    const rawPath = await video.path();
    await writeFile(path.join(ART, 'readme-core-flow-raw-path.txt'), rawPath);
    console.log('video', rawPath);
  }
}

await browser.close();
console.log('capture done →', OUT);
