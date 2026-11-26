import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createMaterialCatalog,
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
  outputSchemas,
  materialSchema,
} from './catalog.mjs';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { getMaterialPrompt } from '../constants/poseMetadata.mjs';
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

  it('searches structured posture, camera view, framing and group without mixing other roles', () => {
    const seated = catalog.searchReferences({
      posture: 'seated',
      view: 'profile',
      cameraHeight: 'unspecified',
      framing: 'full-body',
    });
    expect(seated.items.map((item) => item.id)).toEqual(['pose-seated-profile']);
    expect(catalog.searchReferences({ posture: 'standing' }).items.map((item) => item.id)).toEqual(
      TRYON_MATERIALS.filter((item) => item.pose?.posture === 'standing').map((item) => item.id),
    );
    expect(
      catalog.searchReferences({ groupId: 'hand-on-hip' }).items.map((item) => item.id),
    ).toEqual(['pose-hand-on-hip']);
    expect(catalog.searchReferences({ groupId: 'unknown-group' }).items).toEqual([]);
    expect(catalog.searchReferences({ role: 'clothing', view: 'front' }).items).toEqual([]);
    expect(catalog.searchReferences({ cameraHeight: 'high-angle' }).items).toEqual([]);
    expect(catalog.searchReferences({ query: '四分之三' }).items.map((item) => item.id)).toEqual(
      TRYON_MATERIALS.filter((item) => item.pose?.view === 'three-quarter').map((item) => item.id),
    );
    expect(catalog.searchReferences({ query: 'Not specified' }).items).toHaveLength(3);
    expect(catalog.searchReferences({ query: '未標示' }).items).toHaveLength(3);
    expect(
      catalog.searchReferences({ posture: 'seated', view: 'front' }).items.map((item) => item.id),
    ).toEqual(['seated-study-front-lineart', 'seated-study-front-depth']);
    expect(outputSchemas.searchReferences.safeParse(seated).success).toBe(true);
  });

  it('returns actual pose metadata and the same structured hint as browser generation', () => {
    for (const material of TRYON_MATERIALS) {
      const reference = catalog.getReference({ id: material.id, language: 'en' });
      expect(reference.prompt).toBe(getMaterialPrompt(material, 'en'));
      expect(outputSchemas.getReference.safeParse(reference).success).toBe(true);
      if (material.role === 'pose') {
        expect(reference.pose).toEqual(material.pose);
        expect(reference.prompt).toContain('Pose and camera:');
        if (material.pose?.cameraHeight === 'unspecified')
          expect(reference.prompt).not.toMatch(/eye.level|high.angle|low.angle/i);
      } else expect(reference).not.toHaveProperty('pose');
    }
  });

  it('keeps nested metadata independent of caller mutation', () => {
    const first = catalog.getReference({ id: 'pose-relaxed-front' });
    Object.assign(first.pose!, { view: 'profile' });
    expect(catalog.getReference({ id: 'pose-relaxed-front' }).pose).toMatchObject({
      view: 'front',
    });
  });

  it('validates required metadata and its role boundary at catalog ingestion and output', () => {
    const pose = TRYON_MATERIALS.find((item) => item.id === 'pose-relaxed-front')!;
    const clothing = TRYON_MATERIALS.find((item) => item.role === 'clothing')!;
    expect(materialSchema.safeParse(pose).success).toBe(true);
    expect(materialSchema.safeParse({ ...pose, pose: undefined }).success).toBe(false);
    expect(
      materialSchema.safeParse({ ...pose, pose: { ...pose.pose, cameraHeight: '45-degrees' } })
        .success,
    ).toBe(false);
    expect(
      materialSchema.safeParse({ ...pose, pose: { ...pose.pose, extra: 'unknown' } }).success,
    ).toBe(false);
    expect(materialSchema.safeParse({ ...clothing, pose: pose.pose }).success).toBe(false);
    const reference = catalog.getReference({ id: pose.id });
    expect(outputSchemas.getReference.safeParse({ ...reference, pose: undefined }).success).toBe(
      false,
    );
    expect(outputSchemas.getReference.safeParse({ ...reference, role: 'clothing' }).success).toBe(
      false,
    );
  });

  it('composes enriched pose instructions while preserving custom prompt and ID-only recipes', () => {
    const automatic = catalog.composeBrief({ materialIds: ['pose-hand-on-hip'], language: 'en' });
    expect(automatic.prompt).toContain('Pose and camera:');
    expect(automatic.prompt).toContain('view=three-quarter');
    expect(automatic.references[0].pose).toMatchObject({
      groupId: 'hand-on-hip',
      view: 'three-quarter',
    });
    expect(automatic.recipe.materialIds).toEqual(['pose-hand-on-hip']);
    expect(automatic.recipe).not.toHaveProperty('pose');
    expect(parseTryOnRecipe(automatic.recipe)).toEqual(automatic.recipe);
    const custom = catalog.composeBrief({
      materialIds: ['pose-hand-on-hip'],
      prompt: 'Keep my exact wording.',
    });
    expect(custom.prompt).toBe('Keep my exact wording.');
    expect(custom.recipe).not.toHaveProperty('promptOverride');
  });

  it('paginates without losing or duplicating entries', () => {
    const first = catalog.searchReferences({ limit: 3 });
    const items = [...first.items];
    let next = first.nextOffset;
    while (next !== null) {
      const page = catalog.searchReferences({ offset: next, limit: 3 });
      items.push(...page.items);
      next = page.nextOffset;
    }
    expect(items.map((item) => item.id)).toEqual(TRYON_MATERIALS.map((item) => item.id));
    expect(new Set(items.map((item) => item.id)).size).toBe(TRYON_MATERIALS.length);
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
    { posture: 'lying' },
    { view: 'rear' },
    { cameraHeight: '45-degrees' },
    { framing: 'mid-shot' },
    { groupId: '../../private' },
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

describe('paired camera material catalog', () => {
  it('returns exact representation and camera alternatives with raster URLs', () => {
    const reference = catalog.getReference({ id: 'standing-study-profile-depth', language: 'en' });
    expect(reference.pose).toMatchObject({ groupId: 'standing-study', view: 'profile' });
    expect(reference.poseReference).toEqual({
      pairId: 'standing-study-profile',
      representation: 'depth',
    });
    expect(reference.pairedReference).toMatchObject({
      id: 'standing-study-profile-lineart',
      representation: 'lineart',
    });
    expect(reference.poseAlternatives?.map((item) => item.view)).toEqual([
      'front',
      'three-quarter',
      'profile',
      'back',
    ]);
    expect(reference.poseAlternatives?.every((item) => item.representation === 'depth')).toBe(true);
    expect(reference.requiresRasterization).toBe(false);
    expect(reference.mimeType).toBe('image/png');
    expect(outputSchemas.getReference.safeParse(reference).success).toBe(true);
  });
  it('filters representation without treating it as a pose-metadata field', () => {
    const result = catalog.searchReferences({ view: 'back', representation: 'depth' });
    expect(result.items.map((item) => item.id)).toEqual([
      'standing-study-back-depth',
      'hand-on-hip-study-back-depth',
      'seated-study-back-depth',
    ]);
    expect(catalog.searchReferences({ role: 'clothing', representation: 'depth' }).items).toEqual(
      [],
    );
    expect(() => catalog.searchReferences({ representation: 'photograph' })).toThrow();
  });
  it('composes a v1 recipe that retains the exact selected view and representation', () => {
    const result = catalog.composeBrief({
      materialIds: ['white-oxford-shirt', 'standing-study-back-depth'],
      language: 'en',
    });
    expect(result.recipe.materialIds).toEqual(['white-oxford-shirt', 'standing-study-back-depth']);
    expect(result.prompt).toContain('view=back');
    expect(result.prompt).toMatch(/depth/i);
    expect(parseTryOnRecipe(result.recipe)).toEqual(result.recipe);
  });
});

describe('expanded pose study recipes', () => {
  it.each(['hand-on-hip-study', 'seated-study'])(
    'composes an exact %s pose without mixing other groups',
    (group) => {
      const matches = catalog.searchReferences({
        groupId: group,
        view: 'profile',
        representation: 'depth',
        language: 'en',
      });
      expect(matches.items.map((item) => item.id)).toEqual([`${group}-profile-depth`]);
      const reference = catalog.getReference({ id: `${group}-profile-depth`, language: 'en' });
      expect(reference.poseAlternatives?.every((item) => item.id.startsWith(`${group}-`))).toBe(
        true,
      );
      const result = catalog.composeBrief({
        materialIds: ['white-oxford-shirt', `${group}-profile-depth`],
        language: 'en',
      });
      expect(result.recipe.materialIds).toEqual(['white-oxford-shirt', `${group}-profile-depth`]);
      expect(result.prompt).toContain(
        `posture=${group === 'seated-study' ? 'seated' : 'standing'}`,
      );
      expect(result.prompt).toContain('view=profile');
      expect(result.prompt).toContain('representation=depth');
      expect(parseTryOnRecipe(result.recipe)).toEqual(result.recipe);
    },
  );
});
