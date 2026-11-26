import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const SAMPLE = readFileSync(new URL('./fixtures/sample.png', import.meta.url));
const MATERIALS = JSON.parse(
  readFileSync(new URL('../constants/tryOnMaterials.json', import.meta.url), 'utf8'),
) as Array<{ id: string; image: string }>;

test('production CSP permits provider connections and blocks undeclared origins', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route('https://**/*', async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '{}',
    });
  });
  await page.goto('/materials');
  const result = await page.evaluate(async () => {
    const blocked: string[] = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      blocked.push(`${event.effectiveDirective}:${event.blockedURI}`);
    });
    const hosts = [
      'generativelanguage.googleapis.com',
      'api.openai.com',
      'openrouter.ai',
      'huggingface.co',
      'cdn-lfs.huggingface.co',
      'cdn-lfs-us-1.huggingface.co',
      'hf.co',
      'cdn.jsdelivr.net',
    ];
    const allowed = await Promise.all(
      hosts.map(async (host) => (await fetch(`https://${host}/__csp_probe`)).ok),
    );
    const denied = await fetch('https://undeclared.invalid/__csp_probe').then(
      () => false,
      () => true,
    );
    // CSP violation events dispatch asynchronously after the rejected request.
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { allowed, denied, blocked };
  });
  expect(result.allowed).toEqual(Array(8).fill(true));
  expect(result.denied).toBe(true);
  expect(result.blocked).toContain('connect-src:https://undeclared.invalid/__csp_probe');
  expect(requests.some((url) => url.includes('undeclared.invalid'))).toBe(false);
});

test('production CSP permits the hosted image origin and denies unknown image sources', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route('https://**/*', async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'image/png', body: SAMPLE });
  });
  await page.goto('/materials');
  const result = await page.evaluate(async () => {
    const load = (src: string) =>
      new Promise<boolean>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = src;
      });
    return {
      hosted: await load('https://www.bloss0m.com/__csp_probe.png'),
      unknown: await load('https://undeclared.invalid/__csp_probe.png'),
    };
  });
  expect(result).toEqual({ hosted: true, unknown: false });
  expect(requests.some((url) => url.includes('undeclared.invalid'))).toBe(false);
});

test('all shipped try-on material files load under the production policy', async ({ page }) => {
  await page.goto('/materials');
  const loaded = await page.evaluate(async (materials) => {
    return Promise.all(
      materials.map(
        (material) =>
          new Promise<{ id: string; loaded: boolean }>((resolve) => {
            const image = new Image();
            image.onload = () => resolve({ id: material.id, loaded: image.naturalWidth > 0 });
            image.onerror = () => resolve({ id: material.id, loaded: false });
            image.src = new URL(material.image, new URL('.', document.baseURI)).href;
          }),
      ),
    );
  }, MATERIALS);
  expect(loaded).toEqual(MATERIALS.map(({ id }) => ({ id, loaded: true })));
});
