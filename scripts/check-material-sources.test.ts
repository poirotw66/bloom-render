import { afterEach, describe, expect, it } from 'vitest';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CONTENT_SECURITY_POLICY } from '../constants/csp.mjs';
import {
  ASSET_CATALOGS,
  checkMaterialSources,
  collectAssetReferences,
  typescriptAssetReferences,
  validateAssetReference,
  validateHtmlCsp,
} from './check-material-sources.mjs';
import { listSeoRoutes, outputPathForRoute } from './emit-route-html.mjs';

const temporary: string[] = [];
function temp() {
  const directory = mkdtempSync(path.join(tmpdir(), 'bloom-sources-'));
  temporary.push(directory);
  return directory;
}
function put(root: string, file: string, value: string) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, value);
}
const html = `<html><head><meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}"></head><body></body></html>`;
function fixture() {
  const root = temp();
  for (const spec of ASSET_CATALOGS) {
    if (spec.kind === 'gallery') {
      put(
        root,
        'gallery/example.json',
        JSON.stringify({ id: 'example', thumbnail: 'examples/gallery.webp' }),
      );
      put(root, 'public/examples/gallery.webp', 'fixture');
    } else {
      mkdirSync(path.dirname(path.join(root, spec.file)), { recursive: true });
      copyFileSync(path.resolve(spec.file), path.join(root, spec.file));
    }
  }
  put(root, 'index.html', html);
  const inventory = collectAssetReferences(root);
  expect(inventory.errors).toEqual([]);
  for (const reference of inventory.references) put(root, `public/${reference.value}`, 'fixture');
  return root;
}
function mutateMaterials(root: string, change: (entries: Record<string, unknown>[]) => void) {
  const file = path.join(root, 'constants/tryOnMaterials.json');
  const entries = JSON.parse(readFileSync(file, 'utf8'));
  change(entries);
  writeFileSync(file, JSON.stringify(entries));
}
afterEach(() =>
  temporary.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })),
);

describe('material source and CSP build guard', () => {
  it('validates the actual catalog files and reports optional text-only travel scenes', () => {
    const result = checkMaterialSources();
    expect(result.errors).toEqual([]);
    expect(result.checkedAssets).toBeGreaterThan(500);
    expect(result.textOnlyScenes).toEqual(['london', 'havana']);
  });
  it('fails with the catalog entry and missing file instead of hiding a broken reference', () => {
    const root = fixture();
    rmSync(path.join(root, 'public/images/tryon-materials/white-oxford-shirt.svg'));
    expect(checkMaterialSources({ root }).errors.join('\n')).toContain(
      'white-oxford-shirt].image: missing public/images/tryon-materials/white-oxford-shirt.svg',
    );
  });
  it('validates all scene variants and permits a scene only when its optional reference is omitted', () => {
    const root = fixture();
    const file = path.join(root, 'constants/travel-data/scenes-international.json');
    const entries = JSON.parse(readFileSync(file, 'utf8'));
    entries.find((entry: { id: string }) => entry.id === 'london').referenceImagePath =
      '/images/scenes/london.webp';
    writeFileSync(file, JSON.stringify(entries));
    expect(
      checkMaterialSources({ root }).errors.filter((error: string) => error.includes('[london]')),
    ).toHaveLength(3);
  });
  it('checks license and attribution without granting their origin asset access', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      entries[0].source = 'https://attribution.example/author';
    });
    expect(checkMaterialSources({ root }).errors).toEqual([]);
    mutateMaterials(root, (entries) => {
      entries[0].image = 'https://attribution.example/image.png';
      entries[0].license = '';
      entries[0].source = 'javascript:alert(1)';
    });
    const errors = checkMaterialSources({ root }).errors.join('\n');
    expect(errors).toContain('not trusted for img-src');
    expect(errors).toContain('not trusted for connect-src');
    expect(errors).toContain('requires a local public/ asset');
    expect(errors).toContain('license is required');
    expect(errors).toContain('source attribution must be an HTTPS URL');
  });
  it('rejects duplicate material IDs that would overwrite route output', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      entries[1].id = entries[0].id;
    });
    expect(checkMaterialSources({ root }).errors.join('\n')).toContain('duplicate material ids');
  });
  it('does not accept unsupported catalog asset expressions as an empty successful inventory', () => {
    const spec = ASSET_CATALOGS.find((entry) => entry.kind === 'typescript')!;
    expect(
      typescriptAssetReferences('const cards = [{ thumbnail: externalUrl() }]', spec).errors.join(
        '\n',
      ),
    ).toContain('unsupported asset expression');
    expect(
      typescriptAssetReferences('const cards = [{ thumbnail }]', spec).errors.join(' '),
    ).toContain('unsupported shorthand');
    expect(
      typescriptAssetReferences('const cards = [{ ...anotherCard }]', spec).errors.join(' '),
    ).toContain('catalog spreads');
    expect(
      typescriptAssetReferences("const cards = [{ ['thumbnail']: 'image.png' }]", spec)
        .references[0].value,
    ).toBe('image.png');
    const examples = ASSET_CATALOGS.find((entry) => entry.kind === 'examples')!;
    expect(
      typescriptAssetReferences(
        "const url = name => `changed/${name}.png`; const items = [{src: url('one')}];",
        examples,
      ).errors.join('\n'),
    ).toContain('example URL helper changed');
  });
  it('checks built copies as well as source assets and requires every route shell', () => {
    const root = fixture();
    const distDir = path.join(root, 'dist');
    const inventory = collectAssetReferences(root);
    for (const reference of inventory.references) put(distDir, reference.value, 'fixture');
    for (const file of [
      '404.html',
      ...listSeoRoutes().map(outputPathForRoute),
      ...inventory.materialIds.map((id: string) => `materials/${id}/index.html`),
    ])
      put(distDir, file, html);
    put(
      distDir,
      'assets/taste/moments/cursor-spotlight/demo.html',
      '<html><head></head><body>Vendored demo</body></html>',
    );
    expect(checkMaterialSources({ root, built: true }).errors).toEqual([]);
    rmSync(path.join(distDir, 'images/tryon-materials/white-oxford-shirt.svg'));
    rmSync(path.join(distDir, 'materials/white-oxford-shirt/index.html'));
    put(
      distDir,
      'travel/index.html',
      html.replace('https://api.openai.com', 'https://unexpected.example'),
    );
    const errors = checkMaterialSources({ root, built: true }).errors.join('\n');
    expect(errors).toContain('dist asset');
    expect(errors).toContain('missing route shell');
    expect(errors).toContain('dist/travel/index.html: CSP differs');
  });
});

describe('asset reference boundaries', () => {
  it.each([
    '../secret.png',
    '/images/../secret.png',
    '%2e%2e/secret.png',
    'images/%2f../secret.png',
    '%252e%252e/secret.png',
    '//evil.example/file.png',
    'images\\secret.png',
    'images/file.png?query',
    'data:image/png,abc',
    'https://user:secret@www.bloss0m.com/a.png',
    'http://www.bloss0m.com/a.png',
  ])('rejects unsafe path or URL %s', (value) => {
    expect(validateAssetReference(value, { publicDir: temp() }).length).toBeGreaterThan(0);
  });
  it('rejects a symlink outside public and permits an existing local file', () => {
    const root = temp();
    put(root, 'public/good.png', 'fixture');
    put(root, 'outside.png', 'private');
    symlinkSync(path.join(root, 'outside.png'), path.join(root, 'public/escape.png'));
    expect(validateAssetReference('good.png', { publicDir: path.join(root, 'public') })).toEqual(
      [],
    );
    expect(
      validateAssetReference('escape.png', { publicDir: path.join(root, 'public') }).join(' '),
    ).toContain('symlink escapes');
  });
  it('requires separate connect permission for an image fetched as a reference', () => {
    expect(
      validateAssetReference('https://www.bloss0m.com/image.png', { directives: ['img-src'] }),
    ).toEqual([]);
    expect(
      validateAssetReference('https://www.bloss0m.com/image.png', {
        directives: ['img-src', 'connect-src'],
      }).join(' '),
    ).toContain('not trusted for connect-src');
  });
});

describe('effective HTML CSP', () => {
  it('accepts the shared policy with HTML entities decoded by the parser', () => {
    expect(validateHtmlCsp(html)).toEqual([]);
    expect(validateHtmlCsp(html.replaceAll("'", '&#39;'))).toEqual([]);
  });
  it.each([
    '<!-- META -->',
    '<template>META</template>',
    '<template><template></template>META</template>',
    '<script>const text = `META`;</script>',
    '<title>META</title>',
    '<noscript>META</noscript>',
  ])('rejects an inert policy in %s', (wrapper) => {
    const meta = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;
    expect(
      validateHtmlCsp(`<html><head>${wrapper.replace('META', meta)}</head><body></body></html>`)
        .length,
    ).toBeGreaterThan(0);
  });
  it('rejects duplicate, delayed and body-only CSP policies', () => {
    const meta = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;
    expect(validateHtmlCsp(`<head>${meta}${meta}</head>`).join(' ')).toContain('exactly one');
    expect(
      validateHtmlCsp(`<head><script src="/app.js"></script>${meta}</head>`).join(' '),
    ).toContain('before scripts');
    expect(validateHtmlCsp(`<head></head><body>${meta}</body>`).join(' ')).toContain('in head');
  });
});
