#!/usr/bin/env node
/**
 * Post-build for GitHub Pages / static hosts:
 * - Emit per-route dist/<path>/index.html with unique SEO meta
 * - Copy dist/index.html → dist/404.html for SPA fallback
 * - Write robots.txt + sitemap.xml into dist/
 *
 * Implementation lives in emit-route-html.mjs (pure helpers + CLI).
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(process.execPath, [join(__dirname, 'emit-route-html.mjs')], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
