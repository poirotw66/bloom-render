import { afterEach, describe, expect, it } from 'vitest';
import {
  copyFileSync,
  existsSync,
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
import { POSE_STUDIES } from '../constants/poseStudies.mjs';
import { CLOTHING_GENERATION_MANIFEST } from '../constants/generatedClothing.mjs';
import { validateGeneratedClothing } from './clothing-generation-validation.mjs';
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
function copyPoseStudy(assetDir: string) {
  for (const study of POSE_STUDIES) {
    const manifestPath = study.manifest;
    const manifest = JSON.parse(readFileSync(path.resolve('public', manifestPath), 'utf8'));
    for (const relative of [
      manifestPath,
      ...manifest.pairs.flatMap(
        (pair: { lineart: { image: string }; depth: { image: string } }) => [
          pair.lineart.image,
          pair.depth.image,
        ],
      ),
    ]) {
      const target = path.join(assetDir, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      copyFileSync(path.resolve('public', relative), target);
    }
  }
}
function copyGeneratedClothing(assetDir: string) {
  const source = path.resolve('public', CLOTHING_GENERATION_MANIFEST);
  if (!existsSync(source)) return;
  const manifest = JSON.parse(readFileSync(source, 'utf8'));
  for (const relative of [
    CLOTHING_GENERATION_MANIFEST,
    ...manifest.images.map((image: { image: string }) => image.image),
  ]) {
    const target = path.join(assetDir, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.resolve('public', relative), target);
  }
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
  copyPoseStudy(path.join(root, 'public'));
  copyGeneratedClothing(path.join(root, 'public'));
  put(
    root,
    'scripts/generate-pose-study.py',
    readFileSync(path.resolve('scripts/generate-pose-study.py'), 'utf8'),
  );
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
  it('detects changed generated image bytes and missing generation provenance', () => {
    const root = fixture();
    expect(validateGeneratedClothing(root)).toEqual([]);
    const image = path.join(root, 'public/images/tryon-materials/white-crew-neck-tee.png');
    writeFileSync(image, Buffer.concat([readFileSync(image), Buffer.from('changed')]));
    expect(validateGeneratedClothing(root).join('\n')).toContain(
      'image hash differs from manifest',
    );
    copyGeneratedClothing(path.join(root, 'public'));
    rmSync(path.join(root, 'public', CLOTHING_GENERATION_MANIFEST));
    expect(validateGeneratedClothing(root).join('\n')).toContain(
      'cannot verify generation provenance',
    );
  });
  it('rejects removing or relabeling reviewed generated references as original CC0 assets', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      entries.find((entry) => entry.id === 'white-crew-neck-tee')!.license = 'CC0-1.0';
    });
    expect(validateGeneratedClothing(root).join('\n')).toContain(
      'must retain their AI-generated provenance label',
    );
    mutateMaterials(root, (entries) => {
      for (let index = entries.length - 1; index >= 0; index--)
        if (
          entries[index].license === 'LicenseRef-AI-Generated' ||
          entries[index].id === 'white-crew-neck-tee'
        )
          entries.splice(index, 1);
    });
    expect(validateGeneratedClothing(root).join('\n')).toContain('same twelve unique IDs');
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
    copyPoseStudy(distDir);
    copyGeneratedClothing(distDir);
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
    rmSync(path.join(distDir, 'images/tryon-materials/seated-study-manifest.json'));
    rmSync(path.join(distDir, 'materials/white-oxford-shirt/index.html'));
    put(
      distDir,
      'travel/index.html',
      html.replace('https://api.openai.com', 'https://unexpected.example'),
    );
    const errors = checkMaterialSources({ root, built: true }).errors.join('\n');
    expect(errors).toContain('dist asset');
    expect(errors).toContain('seated-study-manifest.json');
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

describe('paired pose provenance guard', () => {
  it('rejects image bytes that do not match the declared paired render', () => {
    const root = fixture();
    put(root, 'public/images/tryon-materials/standing-study-profile-depth.png', 'tampered');
    expect(checkMaterialSources({ root }).errors.join('\n')).toContain('depth image hash differs');
  });
  it('rejects a missing pair member and inconsistent camera metadata', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      const item = entries.find((entry) => entry.id === 'standing-study-front-depth')!;
      (item.pose as Record<string, unknown>).view = 'back';
    });
    expect(checkMaterialSources({ root }).errors.join('\n')).toContain(
      'identical pose and camera metadata',
    );
  });
  it('rejects a changed camera or generator instead of trusting the manifest name', () => {
    const root = fixture();
    const file = path.join(root, 'public/images/tryon-materials/standing-study-manifest.json');
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    manifest.pairs[0].camera.yawDegrees = 90;
    writeFileSync(file, JSON.stringify(manifest));
    put(root, 'scripts/generate-pose-study.py', 'changed generator');
    const errors = checkMaterialSources({ root }).errors.join('\n');
    expect(errors).toContain('generator hash differs');
    expect(errors).toContain('inconsistent orthographic camera');
  });
});

describe('registered multi-study provenance', () => {
  it('requires a manifest for each registered catalog group', () => {
    const root = fixture();
    rmSync(path.join(root, 'public/images/tryon-materials/seated-study-manifest.json'));
    expect(checkMaterialSources({ root }).errors.join('\n')).toContain(
      'pose study seated-study: missing or invalid images/tryon-materials/seated-study-manifest.json',
    );
  });
  it('rejects an incorrect seated posture even when both pair members agree', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      for (const item of entries.filter((entry) =>
        String(entry.id).startsWith('seated-study-front-'),
      ))
        (item.pose as Record<string, unknown>).posture = 'standing';
    });
    expect(checkMaterialSources({ root }).errors.join('\n')).toContain(
      'seated-study-front: depth catalog identity, view or provenance differs',
    );
  });
  it('rejects a partner borrowed from another study', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      const item = entries.find((entry) => entry.id === 'seated-study-front-depth')!;
      (item.poseReference as Record<string, unknown>).pairId = 'hand-on-hip-study-front';
    });
    const errors = checkMaterialSources({ root }).errors.join('\n');
    expect(errors).toContain('exactly one lineart and one depth');
    expect(errors).toContain('seated-study-front: depth catalog identity');
  });
  it('rejects undeclared groups and removal of a registered catalog group', () => {
    const root = fixture();
    mutateMaterials(root, (entries) => {
      for (const item of entries.filter((entry) => String(entry.id).startsWith('seated-study-')))
        (item.pose as Record<string, unknown>).groupId = 'unregistered-study';
    });
    const errors = checkMaterialSources({ root }).errors.join('\n');
    expect(errors).toContain('paired pose group is not a registered original study');
    expect(errors).toContain('pose study seated-study: registered study has no catalog pairs');
  });
  it('does not use a manifest-controlled path for image or generator reads', () => {
    const root = fixture();
    const file = path.join(root, 'public/images/tryon-materials/hand-on-hip-study-manifest.json');
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    manifest.generator = '../../foreign-generator.py';
    manifest.pairs[0].depth.image = '../../foreign-image.png';
    writeFileSync(file, JSON.stringify(manifest));
    const errors = checkMaterialSources({ root }).errors.join('\n');
    expect(errors).toContain('unexpected generator path');
    expect(errors).toContain('depth needs a local PNG path and SHA-256');
    expect(errors).not.toContain('cannot read depth image');
  });
  it('rejects malformed pair descriptors, depth ranges and camera directions', () => {
    const root = fixture();
    const file = path.join(root, 'public/images/tryon-materials/seated-study-manifest.json');
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    manifest.pairs[0] = null;
    manifest.depth.far = manifest.depth.near;
    manifest.pairs[1].camera.position = [0, 1.3, 4];
    writeFileSync(file, JSON.stringify(manifest));
    const errors = checkMaterialSources({ root }).errors.join('\n');
    expect(errors).toContain('invalid pair identity');
    expect(errors).toContain('depth must declare normalized synthetic camera depth');
    expect(errors).toContain('inconsistent orthographic camera');
  });
});
