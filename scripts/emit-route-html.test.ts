/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTES } from '../constants/routes';
import { CONTENT_SECURITY_POLICY } from '../constants/csp';
import {
  ROUTE_SEO,
  absoluteUrlForRoute,
  applySeoMeta,
  buildRobotsTxt,
  buildSitemapXml,
  emitRouteHtml,
  listSeoRoutes,
  outputPathForRoute,
} from './emit-route-html.mjs';

const MINIMAL_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>BloomRender — Let your ideas bloom.</title>
    <meta name="description" content="Old description" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Old title" />
    <meta property="og:description" content="Old og desc" />
    <meta property="og:image" content="https://www.bloss0m.com/bloom-render/og.png" />
    <meta property="og:url" content="https://www.bloss0m.com/bloom-render/" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://www.bloss0m.com/bloom-render/og.png" />
    <meta name="twitter:description" content="Old twitter desc" />
  </head>
  <body><div id="root"></div></body>
</html>`;

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('route SEO helpers', () => {
  it('lists the same paths as constants/routes.ts', () => {
    const fromConstants = new Set(Object.values(ROUTES));
    const fromSeo = new Set(listSeoRoutes());
    expect(fromSeo).toEqual(fromConstants);
  });

  it('maps routes to expected output paths', () => {
    expect(outputPathForRoute('/')).toBe('index.html');
    expect(outputPathForRoute(ROUTES.HOME)).toBe('index.html');
    expect(outputPathForRoute(ROUTES.TRAVEL)).toBe('travel/index.html');
    expect(outputPathForRoute(ROUTES.ID_PHOTO_BATCH)).toBe('idphoto/batch/index.html');
    expect(outputPathForRoute(ROUTES.PROMPT_GALLERY)).toBe('prompt-gallery/index.html');
  });

  it('builds absolute URLs with /bloom-render/ base', () => {
    expect(absoluteUrlForRoute('/')).toBe('https://www.bloss0m.com/bloom-render/');
    expect(absoluteUrlForRoute('/travel')).toBe('https://www.bloss0m.com/bloom-render/travel');
    expect(absoluteUrlForRoute('/idphoto/batch')).toBe(
      'https://www.bloss0m.com/bloom-render/idphoto/batch',
    );
  });

  it('applies unique title, description, og, twitter, and canonical tags', () => {
    const html = applySeoMeta(MINIMAL_HTML, {
      title: 'AI Travel Photo — BloomRender',
      description: 'Travel shots. AI 旅遊照。',
      url: 'https://www.bloss0m.com/bloom-render/travel',
      image: 'https://www.bloss0m.com/bloom-render/og.png',
    });
    expect(html).toContain('<title>AI Travel Photo — BloomRender</title>');
    expect(html).toContain('name="description" content="Travel shots. AI 旅遊照。"');
    expect(html).toContain('property="og:title" content="AI Travel Photo — BloomRender"');
    expect(html).toContain(
      'property="og:url" content="https://www.bloss0m.com/bloom-render/travel"',
    );
    expect(html).toContain('name="twitter:title" content="AI Travel Photo — BloomRender"');
    expect(html).toContain('name="twitter:description" content="Travel shots. AI 旅遊照。"');
    expect(html).toContain('rel="canonical" href="https://www.bloss0m.com/bloom-render/travel"');
  });

  it('emits expected files with unique titles into a temp dist', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'bloom-seo-'));
    tempDirs.push(distDir);
    writeFileSync(join(distDir, 'index.html'), MINIMAL_HTML, 'utf8');

    const { written, titles } = emitRouteHtml({
      distDir,
      indexHtml: MINIMAL_HTML,
    });

    expect(written).toContain('index.html');
    expect(written).toContain('404.html');
    expect(written).toContain('travel/index.html');
    expect(written).toContain('idphoto/batch/index.html');
    expect(written).toContain('robots.txt');
    expect(written).toContain('sitemap.xml');

    const titleValues = Object.values(titles);
    expect(new Set(titleValues).size).toBe(titleValues.length);

    const travelHtml = readFileSync(join(distDir, 'travel/index.html'), 'utf8');
    expect(travelHtml).toContain(`<title>${ROUTE_SEO['/travel'].title}</title>`);
    expect(travelHtml).not.toContain(`<title>${ROUTE_SEO['/'].title}</title>`);
    expect(travelHtml).toContain(`content="${CONTENT_SECURITY_POLICY}"`);
    expect(travelHtml).toContain('name="theme-color" content="#1a1216"');

    const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
    const fallbackHtml = readFileSync(join(distDir, '404.html'), 'utf8');
    expect(fallbackHtml).toBe(homeHtml);

    const batchHtml = readFileSync(join(distDir, 'idphoto/batch/index.html'), 'utf8');
    expect(batchHtml).toContain(ROUTE_SEO['/idphoto/batch'].title);
    expect(batchHtml).toContain(
      'rel="canonical" href="https://www.bloss0m.com/bloom-render/idphoto/batch"',
    );

    const robots = readFileSync(join(distDir, 'robots.txt'), 'utf8');
    expect(robots).toContain('Allow: /bloom-render/');
    expect(robots).toContain('Sitemap: https://www.bloss0m.com/bloom-render/sitemap.xml');

    const sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf8');
    for (const path of Object.values(ROUTES)) {
      const loc =
        path === '/'
          ? 'https://www.bloss0m.com/bloom-render/'
          : `https://www.bloss0m.com/bloom-render${path}`;
      expect(sitemap).toContain(`<loc>${loc}</loc>`);
    }
  });

  it('buildRobotsTxt and buildSitemapXml stay on /bloom-render/ base', () => {
    expect(buildRobotsTxt()).toContain('/bloom-render/');
    const xml = buildSitemapXml();
    expect(xml).toContain('https://www.bloss0m.com/bloom-render/prompt-gallery');
    expect(xml.match(/<url>/g)?.length).toBe(listSeoRoutes().length);
  });
});
