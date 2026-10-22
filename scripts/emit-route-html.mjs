#!/usr/bin/env node
/**
 * After Vite build: copy SPA 404 fallback and emit per-route index.html with unique SEO meta.
 * Pure helpers are exported for unit tests (no Vite build required).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/** Site origin + path base for GitHub Pages / bloss0m hosting. */
export const SITE_ORIGIN = 'https://www.bloss0m.com';
export const PATH_BASE = '/bloom-render';
export const SITE_BASE = `${SITE_ORIGIN}${PATH_BASE}`;
export const DEFAULT_OG_IMAGE = `${SITE_BASE}/og.png`;

/**
 * App routes mirrored from constants/routes.ts (kept in sync by unit test).
 * Titles/descriptions: English primary; Chinese included in description where natural.
 */
export const ROUTE_SEO = {
  '/': {
    title: 'BloomRender — Let your ideas bloom.',
    description:
      'BloomRender is a browser-based AI photo studio for ID photos, portraits, travel shots, try-on, and edits. 瀏覽器 AI 影像工作室：證件照、人像、旅遊照、試穿與修圖。 Bring your own Gemini or OpenRouter key.',
  },
  '/generate': {
    title: 'Generate Image — BloomRender',
    description:
      'Text-to-image generation in the browser. 文字生成圖片 — describe a scene and create photos with your own API key.',
  },
  '/edit': {
    title: 'Edit Photo — BloomRender',
    description:
      'AI photo editing: retouch, filters, and adjustments. 智慧修圖、濾鏡與專業調整 — edit in your browser.',
  },
  '/history': {
    title: 'Generation History — BloomRender',
    description:
      'Browse and manage your generated photos. 檢視與管理生成紀錄 — reopen past results from this device.',
  },
  '/idphoto': {
    title: 'ID Photo Studio — BloomRender',
    description:
      'Instant pro-ready ID photos with correct sizing, attire, and retouch. 一鍵證件照：尺寸、服裝與美化一次完成。',
  },
  '/idphoto/batch': {
    title: 'Batch ID Photos — BloomRender',
    description:
      'Upload multiple portraits and generate ID photos in batch. 批量證件照：一次上傳多張人像並批次產出。',
  },
  '/portrait': {
    title: 'Portrait Retouch — BloomRender',
    description:
      'Upload a portrait, set the output spec, and get polished shots. 人像精修：設定規格，產出可直接使用的專業肖像。',
  },
  '/travel': {
    title: 'AI Travel Photo — BloomRender',
    description:
      'Choose a map scene and generate travel photos for your vibe. AI 旅遊照：從地圖選景，生成符合風格的旅行照片。',
  },
  '/themed': {
    title: 'Themed Photoshoot — BloomRender',
    description:
      'Pick a theme and generate styled photos with outfits and mood. 主題寫真：服裝、姿勢與氛圍一次設定。',
  },
  '/couple-group': {
    title: 'Couple & Group Photography — BloomRender',
    description:
      'Create beautiful photos for couples, families, and groups. 情侶／全家福：為雙人與團體生成溫馨合照。',
  },
  '/try-on': {
    title: 'AI Try-On — BloomRender',
    description:
      'Virtual clothing try-on from a photo and garment reference. AI 試穿：上傳人像與服裝，預覽上身效果。',
  },
  '/photography-service': {
    title: 'Photography Studio — BloomRender',
    description:
      'Professional photography service presets for resumes, branding, and moments. 專業照片館方案：形象照、履歷與紀念照。',
  },
  '/enhance': {
    title: 'Local Enhance — BloomRender',
    description:
      'Enhance photos locally in the browser without sending them to a cloud AI. 本機影像強化：不上傳雲端 AI 即可提升畫質。',
  },
  '/prompt-gallery': {
    title: 'Prompt Gallery — BloomRender',
    description:
      'Community prompt presets for generate, retouch, filters, and adjustments. 提示詞藝廊：一鍵套用社群精選提示。',
  },
};

/** Ordered route paths (same set as Object.values(ROUTES)). */
export function listSeoRoutes() {
  return Object.keys(ROUTE_SEO);
}

/** Absolute public URL for a route path (e.g. `/travel` → `https://…/bloom-render/travel`). */
export function absoluteUrlForRoute(routePath) {
  if (!routePath || routePath === '/') {
    return `${SITE_BASE}/`;
  }
  const trimmed = routePath.replace(/\/+$/, '');
  return `${SITE_BASE}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/**
 * Relative output path under dist/ for a route.
 * HOME → `index.html`; `/idphoto/batch` → `idphoto/batch/index.html`.
 */
export function outputPathForRoute(routePath) {
  if (!routePath || routePath === '/') {
    return 'index.html';
  }
  const trimmed = routePath.replace(/^\/+|\/+$/g, '');
  return `${trimmed}/index.html`;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function upsertMetaByName(html, name, content) {
  const re = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertMetaByProperty(html, property, content) {
  const re = new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*>`, 'i');
  const tag = `<meta property="${property}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertLinkRel(html, rel, href) {
  const re = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeAttr(href)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

/**
 * Replace/insert SEO tags in an index.html shell.
 * @param {string} html
 * @param {{ title: string, description: string, url: string, image: string }} meta
 */
export function applySeoMeta(html, meta) {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${meta.title}</title>`);
  out = upsertMetaByName(out, 'description', meta.description);
  out = upsertMetaByProperty(out, 'og:title', meta.title);
  out = upsertMetaByProperty(out, 'og:description', meta.description);
  out = upsertMetaByProperty(out, 'og:url', meta.url);
  out = upsertMetaByProperty(out, 'og:image', meta.image);
  out = upsertMetaByName(out, 'twitter:title', meta.title);
  out = upsertMetaByName(out, 'twitter:description', meta.description);
  out = upsertMetaByName(out, 'twitter:image', meta.image);
  out = upsertLinkRel(out, 'canonical', meta.url);
  return out;
}

export function buildRobotsTxt({ pathBase = PATH_BASE, sitemapUrl } = {}) {
  const base = pathBase.endsWith('/') ? pathBase.slice(0, -1) : pathBase;
  const sitemap = sitemapUrl ?? `${SITE_ORIGIN}${base}/sitemap.xml`;
  return [`User-agent: *`, `Allow: ${base}/`, ``, `Sitemap: ${sitemap}`, ``].join('\n');
}

export function buildSitemapXml(routePaths = listSeoRoutes(), { siteBase = SITE_BASE } = {}) {
  const origin = siteBase.replace(/\/+$/, '');
  const urls = routePaths.map((routePath) => {
    const loc =
      !routePath || routePath === '/'
        ? `${origin}/`
        : `${origin}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join('\n');
}

/**
 * Emit per-route HTML + 404 fallback + robots/sitemap into an output directory.
 * @param {{
 *   distDir: string,
 *   indexHtml: string,
 *   routes?: typeof ROUTE_SEO,
 *   ogImage?: string,
 *   writeRobotsAndSitemap?: boolean,
 * }} opts
 * @returns {{ written: string[], titles: Record<string, string> }}
 */
export function emitRouteHtml(
  {
    distDir,
    indexHtml,
    routes = ROUTE_SEO,
    ogImage = DEFAULT_OG_IMAGE,
    writeRobotsAndSitemap = true,
  } = /** @type {{ distDir: string, indexHtml: string, routes?: typeof ROUTE_SEO, ogImage?: string, writeRobotsAndSitemap?: boolean }} */ ({}),
) {
  if (!indexHtml || typeof indexHtml !== 'string') {
    throw new Error('emitRouteHtml: indexHtml string is required');
  }
  if (!distDir) {
    throw new Error('emitRouteHtml: distDir is required');
  }

  mkdirSync(distDir, { recursive: true });

  const written = [];
  const titles = {};

  for (const [routePath, seo] of Object.entries(routes)) {
    const url = absoluteUrlForRoute(routePath);
    const html = applySeoMeta(indexHtml, {
      title: seo.title,
      description: seo.description,
      url,
      image: ogImage,
    });
    const relOut = outputPathForRoute(routePath);
    const absOut = join(distDir, relOut);
    mkdirSync(dirname(absOut), { recursive: true });
    writeFileSync(absOut, html, 'utf8');
    written.push(relOut);
    titles[routePath] = seo.title;
  }

  // SPA fallback for GitHub Pages
  const homeHtmlPath = join(distDir, 'index.html');
  copyFileSync(homeHtmlPath, join(distDir, '404.html'));
  written.push('404.html');

  if (writeRobotsAndSitemap) {
    const robots = buildRobotsTxt();
    const sitemap = buildSitemapXml(Object.keys(routes));
    writeFileSync(join(distDir, 'robots.txt'), robots, 'utf8');
    writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf8');
    written.push('robots.txt', 'sitemap.xml');
  }

  return { written, titles };
}

function resolveOgImage(repoRoot = REPO_ROOT) {
  // Prefer hosted URL; public/og.png confirms the asset ships with the build.
  if (existsSync(join(repoRoot, 'public', 'og.png'))) {
    return DEFAULT_OG_IMAGE;
  }
  return DEFAULT_OG_IMAGE;
}

function main() {
  const distDir = join(REPO_ROOT, 'dist');
  const indexPath = join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    console.error('emit-route-html: dist/index.html missing — run vite build first');
    process.exit(1);
  }
  const indexHtml = readFileSync(indexPath, 'utf8');
  const { written } = emitRouteHtml({
    distDir,
    indexHtml,
    ogImage: resolveOgImage(),
  });
  console.log(`emit-route-html: wrote ${written.length} files`);
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entry) {
  main();
}
