import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createMaterialCatalog,
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
  outputSchemas,
} from './catalog.mjs';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { SITE_URL } from '../constants/site';
import { parseTryOnRecipe } from '../types/tryOnRecipe';
import { parseRemixHash } from '../utils/remixLink';

const catalog = createMaterialCatalog();
const ids = ['lighting-soft-window', 'white-oxford-shirt', 'pose-hand-on-hip'];

describe('read-only material catalog', () => {
  it('uses the current browser catalog and canonical site URL', () => {
    expect(DEFAULT_SITE_URL).toBe(SITE_URL);
    const result = catalog.listCollections();
    expect(result.total).toBe(TRYON_MATERIALS.length);
    expect(result.collections.reduce((sum, item) => sum + item.count, 0)).toBe(result.total);
    expect(result.collections.map((item) => item.role)).toEqual(['clothing', 'pose', 'lighting']);
    expect(result.collections[0].title).toBe('服裝');
    expect(catalog.listCollections({ language: 'en' }).collections[0].title).toBe('Clothing');
    expect(outputSchemas.listCollections.safeParse(result).success).toBe(true);
  });

  it('searches both languages and normalizes full-width characters', () => {
    expect(
      catalog.searchReferences({ query: '白色', role: 'clothing' }).items.map((item) => item.id),
    ).toContain('white-oxford-shirt');
    expect(
      catalog
        .searchReferences({ query: 'ＯＸＦＯＲＤ', language: 'en' })
        .items.map((item) => item.id),
    ).toEqual(['white-oxford-shirt']);
    expect(
      catalog
        .searchReferences({ query: 'soft window', role: 'lighting' })
        .items.map((item) => item.id),
    ).toEqual(['lighting-soft-window']);
    expect(catalog.searchReferences({ query: 'oxford', role: 'pose' }).total).toBe(0);
  });

  it('paginates without losing or duplicating entries', () => {
    const first = catalog.searchReferences({ limit: 3 });
    const second = catalog.searchReferences({ offset: first.nextOffset!, limit: 3 });
    const last = catalog.searchReferences({ offset: second.nextOffset!, limit: 3 });
    expect([...first.items, ...second.items, ...last.items].map((item) => item.id)).toEqual(
      TRYON_MATERIALS.map((item) => item.id),
    );
    expect(last.nextOffset).toBeNull();
    expect(catalog.searchReferences({ offset: 500 }).items).toEqual([]);
    expect(outputSchemas.searchReferences.safeParse(first).success).toBe(true);
  });

  it.each([
    { limit: 0 },
    { limit: 51 },
    { offset: -1 },
    { offset: 0.5 },
    { query: 'x'.repeat(201) },
    { role: 'portrait' },
    { language: 'ja' },
    { apiKey: 'secret' },
  ])('rejects invalid search input %j', (input) => {
    expect(() => catalog.searchReferences(input)).toThrow();
  });

  it('resolves exact catalog references, with real URLs, licensing and SVG requirements', () => {
    const reference = catalog.getReference({ id: 'white-oxford-shirt', language: 'en' });
    expect(reference).toMatchObject({
      id: 'white-oxford-shirt',
      title: 'Oxford shirt',
      role: 'clothing',
      mimeType: 'image/svg+xml',
      requiresRasterization: true,
      license: 'CC0-1.0',
    });
    expect(reference.imageUrl).toBe(`${SITE_URL}images/tryon-materials/white-oxford-shirt.svg`);
    expect(reference.pageUrl).toBe(`${SITE_URL}materials/white-oxford-shirt`);
    expect(reference.prompt).toBe(TRYON_MATERIALS[0].prompt);
    expect(reference.source).toBe(TRYON_MATERIALS[0].source);
    expect(outputSchemas.getReference.safeParse(reference).success).toBe(true);
    const bytes = readFileSync(
      new URL('../public/images/tryon-materials/white-oxford-shirt.svg', import.meta.url),
      'utf8',
    );
    expect(bytes).toContain('<svg');
  });

  it.each(['unknown-material', 'constructor', '../../.env', 'https://example.com/photo.png'])(
    'never resolves arbitrary ID %s',
    (id) => {
      expect(() => catalog.getReference({ id })).toThrow();
    },
  );

  it('returns independent results so caller mutation cannot alter the catalog', () => {
    const first = catalog.getReference({ id: 'white-oxford-shirt' });
    first.title = 'Changed';
    expect(catalog.getReference({ id: 'white-oxford-shirt' }).title).toBe('白色牛津襯衫');
  });
});

describe('reference briefs and app recipes', () => {
  it('preserves supplied reference order and exact custom prompt while keeping it out of the recipe', () => {
    const prompt = '私人備註。 Keep this wording exactly.\nDo not alter it.';
    const output = catalog.composeBrief({ materialIds: ids, prompt });
    expect(output.prompt).toBe(prompt);
    expect(output.brief.startsWith(`${prompt}\n\n`)).toBe(true);
    expect(output.references.map((ref) => ref.id)).toEqual(ids);
    expect(output.references.map((ref) => ref.slot)).toEqual([1, 2, 3]);
    expect(output.brief).toContain('參考圖，依照選取順序');
    expect(output.brief.indexOf(output.references[0].imageUrl)).toBeLessThan(
      output.brief.indexOf(output.references[1].imageUrl),
    );
    expect(output.recipe.materialIds).toEqual(ids);
    expect(output.recipe).not.toHaveProperty('promptOverride');
    expect(JSON.stringify(output.recipe)).not.toContain(prompt);
    expect(output.notes.join(' ')).toContain('PNG');
    expect(outputSchemas.composeBrief.safeParse(output).success).toBe(true);
  });

  it('produces a link understood by the existing app parsers', () => {
    const output = catalog.composeBrief({ materialIds: ids, language: 'en' });
    expect(parseTryOnRecipe(output.recipe)).toEqual(output.recipe);
    const link = new URL(output.recipeUrl);
    expect(link.pathname).toBe('/bloom-render/r');
    expect(parseRemixHash(link.hash)).toEqual({ v: 1, f: 'tryon', recipe: output.recipe });
    expect(link.hash.length - 1).toBeLessThanOrEqual(1500);
    expect(output.notes.join(' ')).toContain('does not include this brief prompt');
    expect(output.brief).toContain('Image 1');
  });

  it.each([
    { materialIds: [] },
    { materialIds: ['white-oxford-shirt', 'white-oxford-shirt'] },
    { materialIds: ['pose-hand-on-hip', 'pose-seated-profile'] },
    { materialIds: ['lighting-soft-window', 'lighting-warm-rim'] },
    { materialIds: ['not-a-material'] },
    { materialIds: ids, prompt: ' ' },
    { materialIds: ids, prompt: 'x'.repeat(8001) },
    { materialIds: ids, apiKey: 'secret' },
  ])(
    'rejects invalid or ambiguous selections instead of silently dropping references %j',
    (input) => {
      expect(() => catalog.composeBrief(input)).toThrow();
    },
  );

  it('accepts a maximum-length custom brief without putting it into the recipe link', () => {
    const output = catalog.composeBrief({ materialIds: ids, prompt: 'x'.repeat(8000) });
    expect(output.prompt).toHaveLength(8000);
    expect(new URL(output.recipeUrl).hash).not.toContain('x'.repeat(100));
  });
});

describe('deployment base URL', () => {
  it.each(['https://example.com/custom', 'https://example.com/custom/'])(
    'keeps a deployment subpath for %s',
    (siteUrl) => {
      const local = createMaterialCatalog({ siteUrl });
      const ref = local.getReference({ id: 'white-oxford-shirt' });
      expect(ref.imageUrl).toBe(
        'https://example.com/custom/images/tryon-materials/white-oxford-shirt.svg',
      );
      expect(new URL(local.composeBrief({ materialIds: ids }).recipeUrl).pathname).toBe(
        '/custom/r',
      );
    },
  );

  it('supports local preview without fetching any URL', () => {
    expect(
      createMaterialCatalog({ siteUrl: 'http://127.0.0.1:4196/' }).getReference({
        id: 'white-oxford-shirt',
      }).pageUrl,
    ).toBe('http://127.0.0.1:4196/materials/white-oxford-shirt');
  });

  it.each([
    'file:///tmp/catalog',
    'ftp://example.com',
    'https://secret:token@example.com/path',
    'https://example.com/path?key=secret',
    'https://example.com/path#secret',
    '',
    'invalid',
  ])('rejects unsafe or ambiguous deployment configuration without echoing it', (siteUrl) => {
    expect(() => normalizeSiteUrl(siteUrl)).toThrow('Invalid BLOOMRENDER_SITE_URL');
    try {
      normalizeSiteUrl(siteUrl);
    } catch (error) {
      expect((error as Error).message).not.toContain('secret');
    }
  });
});
