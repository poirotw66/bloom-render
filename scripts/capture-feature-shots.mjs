/**
 * Capture feature-page screenshots across themes and widths.
 * Usage: node scripts/capture-feature-shots.mjs --base http://127.0.0.1:4173 --prefix before
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const BASE = args.base || 'http://127.0.0.1:4174';
const PREFIX = args.prefix || 'after';
const OUT = args.out || '/opt/cursor/artifacts';

const THEMES = ['bloom', 'night', 'newyear'];
const WIDTHS = [1440, 390];
const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'generate', path: '/generate' },
  { slug: 'history', path: '/history' },
  { slug: 'idphoto', path: '/idphoto' },
  { slug: 'idphoto-batch', path: '/idphoto/batch' },
  { slug: 'portrait', path: '/portrait' },
  { slug: 'travel', path: '/travel' },
  { slug: 'themed', path: '/themed' },
  { slug: 'couple-group', path: '/couple-group' },
  { slug: 'try-on', path: '/try-on' },
  { slug: 'photography-service', path: '/photography-service' },
  { slug: 'enhance', path: '/enhance' },
  { slug: 'prompt-gallery', path: '/prompt-gallery' },
  { slug: 'edit', path: '/edit' },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript((t) => {
      localStorage.setItem('bloom_theme', t);
      localStorage.removeItem('bloom_api_key');
      localStorage.removeItem('bloom_openrouter_api_key');
    }, theme);

    for (const route of PAGES) {
      const file = path.join(OUT, `${PREFIX}-${route.slug}-${theme}-${width}.png`);
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: file, fullPage: true });
      console.log('wrote', file);
    }

    // Settings modal on home
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(300);
    const settingsBtn = page
      .locator(
        'button[aria-label*="Settings"], button[aria-label*="設定"], button[aria-label*="settings"], button:has-text("Settings")',
      )
      .first();
    if (await settingsBtn.count()) {
      await settingsBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
    } else {
      // Header gear often has title or svg only
      const gear = page
        .locator('header button')
        .filter({ has: page.locator('svg') })
        .last();
      await gear.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const settingsFile = path.join(OUT, `${PREFIX}-settings-${theme}-${width}.png`);
    await page.screenshot({ path: settingsFile, fullPage: true });
    console.log('wrote', settingsFile);

    await context.close();
  }
}

await browser.close();
console.log('done', PREFIX);
