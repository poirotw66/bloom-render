#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { CONTENT_SECURITY_POLICY } from '../constants/csp.mjs';
import { NETWORK_SOURCES, validateNetworkSources } from '../constants/networkSources.mjs';
import { sceneRefPath, sceneThumbPath } from '../utils/imageAssetPaths.mjs';
import { validatePoseStudy } from './pose-study-validation.mjs';
import { listSeoRoutes, outputPathForRoute } from './emit-route-html.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

import { ASSET_CATALOGS } from '../constants/assetSources.mjs';
export { ASSET_CATALOGS };

function inside(base, file) {
  const relative = path.relative(base, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/** A catalog URL never grants its own permission. Only the trusted registry does. */
export function validateAssetReference(
  value,
  {
    publicDir = path.join(REPO_ROOT, 'public'),
    label = 'asset',
    directives = ['img-src'],
    sources = NETWORK_SOURCES,
    localOnly = false,
  } = {},
) {
  const fail = (reason) => [`${label}: ${reason}`];
  if (typeof value !== 'string' || !value || value.trim() !== value)
    return fail('asset must be a nonempty path or HTTPS URL');
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return fail(`invalid asset URL ${value}`);
    }
    if (url.protocol !== 'https:' || url.username || url.password)
      return fail('asset URL must use HTTPS without credentials');
    const errors = directives
      .filter(
        (directive) =>
          !sources.some(
            (source) => source.origin === url.origin && source.directives.includes(directive),
          ),
      )
      .map(
        (directive) =>
          `${label}: ${url.origin} is not trusted for ${directive}; review constants/networkSources.mjs explicitly`,
      );
    if (localOnly)
      errors.push(
        `${label}: this catalog requires a local public/ asset; remote URLs are not supported by its runtime path resolver`,
      );
    return errors;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fail('invalid URL encoding in asset path');
  }
  if (
    decoded.startsWith('//') ||
    /[\\?#\x00-\x1f]/.test(decoded) ||
    decoded.split('/').some((part) => part === '.' || part === '..') ||
    /%[\da-f]{2}/i.test(decoded) ||
    /^[a-z][a-z\d+.-]*:/i.test(decoded)
  )
    return fail(`unsafe local asset path ${value}`);
  const target = path.resolve(publicDir, decoded.replace(/^\//, ''));
  if (!inside(path.resolve(publicDir), target)) return fail('asset escapes public/');
  if (!existsSync(target) || !statSync(target).isFile())
    return fail(`missing public/${decoded.replace(/^\//, '')}`);
  if (!inside(realpathSync(publicDir), realpathSync(target)))
    return fail('asset symlink escapes public/');
  return [];
}

function attributionErrors(entry, label) {
  const errors = [];
  if (typeof entry.license !== 'string' || !entry.license.trim())
    errors.push(`${label}: license is required`);
  try {
    const url = new URL(entry.source);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch {
    errors.push(`${label}: source attribution must be an HTTPS URL without credentials`);
  }
  return errors;
}

/** Extract only the declared asset fields; fail closed when their expression changes. */
export function typescriptAssetReferences(source, spec) {
  const tree = ts.createSourceFile(spec.file, source, ts.ScriptTarget.Latest, true);
  const fields = Array.isArray(spec.field) ? spec.field : [spec.field];
  const references = [];
  const errors = [];
  if (tree.parseDiagnostics.length) errors.push(`${spec.file}: cannot parse asset catalog`);
  let exampleHelperValid = spec.kind !== 'examples';
  function visit(node) {
    if (
      spec.kind === 'examples' &&
      ts.isVariableDeclaration(node) &&
      node.name.getText(tree) === 'url'
    ) {
      const fn = node.initializer;
      const body = fn && ts.isArrowFunction(fn) ? fn.body : undefined;
      exampleHelperValid =
        !!body &&
        ts.isTemplateExpression(body) &&
        body.head.text === 'examples/' &&
        body.templateSpans.length === 1 &&
        body.templateSpans[0].expression.getText(tree) === 'name' &&
        body.templateSpans[0].literal.text === '.webp' &&
        fn.parameters.length === 1 &&
        fn.parameters[0].name.getText(tree) === 'name';
    }
    if (ts.isSpreadAssignment(node) || ts.isSpreadElement(node))
      errors.push(`${spec.file}: catalog spreads require an explicit inventory adapter`);
    if (ts.isShorthandPropertyAssignment(node) && fields.includes(node.name.text))
      errors.push(`${spec.file}: unsupported shorthand asset expression ${node.name.text}`);
    const fieldName =
      node.name && (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name))
        ? node.name.text
        : node.name &&
            ts.isComputedPropertyName(node.name) &&
            ts.isStringLiteralLike(node.name.expression)
          ? node.name.expression.text
          : undefined;
    if (ts.isPropertyAssignment(node) && fields.includes(fieldName)) {
      const expression = node.initializer;
      const label = `${spec.file}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1}`;
      if (ts.isStringLiteralLike(expression)) references.push({ label, value: expression.text });
      else if (
        spec.kind === 'examples' &&
        ts.isCallExpression(expression) &&
        expression.expression.getText(tree) === 'url' &&
        expression.arguments.length === 1 &&
        ts.isStringLiteralLike(expression.arguments[0])
      )
        references.push({ label, value: `examples/${expression.arguments[0].text}.webp` });
      else
        errors.push(
          `${label}: unsupported asset expression; use a literal path or update the catalog inventory adapter`,
        );
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (!exampleHelperValid)
    errors.push(`${spec.file}: example URL helper changed; update the inventory adapter`);
  if (!references.length) errors.push(`${spec.file}: asset catalog is empty`);
  return { references, errors };
}

export function collectAssetReferences(root = REPO_ROOT) {
  const references = [];
  const materialIds = [];
  const textOnlyScenes = [];
  const errors = [];
  for (const spec of ASSET_CATALOGS) {
    try {
      if (spec.kind === 'typescript' || spec.kind === 'examples') {
        const result = typescriptAssetReferences(
          readFileSync(path.join(root, spec.file), 'utf8'),
          spec,
        );
        references.push(...result.references);
        errors.push(...result.errors);
        continue;
      }
      const files =
        spec.kind === 'gallery'
          ? readdirSync(path.join(root, spec.file))
              .filter((file) => file.endsWith('.json') && file !== 'schema.json')
              .sort()
              .map((file) => `${spec.file}/${file}`)
          : [spec.file];
      if (!files.length) errors.push(`${spec.file}: catalog is empty`);
      for (const file of files) {
        const data = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
        const entries = spec.kind === 'gallery' ? [data] : data;
        if (!Array.isArray(entries) || !entries.length) {
          errors.push(`${file}: expected a nonempty catalog array`);
          continue;
        }
        for (const [index, entry] of entries.entries()) {
          const label = `${file}[${entry?.id ?? index}].${spec.field}`;
          if (!entry || typeof entry !== 'object') {
            errors.push(`${label}: expected an object`);
            continue;
          }
          const value = entry[spec.field];
          if (value !== undefined || spec.required) references.push({ label, value });
          if (spec.kind === 'materials') {
            errors.push(...attributionErrors(entry, `${file}[${entry.id ?? index}]`));
            if (typeof entry.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id))
              materialIds.push(entry.id);
            else errors.push(`${file}[${index}]: invalid material id`);
          }
          if (spec.kind === 'scenes' && value === undefined) textOnlyScenes.push(entry.id);
          if (spec.kind === 'scenes' && typeof value === 'string') {
            // Scene paths name an asset family; the original file is not shipped.
            references.pop();
            if (!/^\/images\/scenes\/[a-z0-9_-]+\.webp$/.test(value)) {
              errors.push(`${label}: expected /images/scenes/<basename>.webp`);
              continue;
            }
            const variants = [
              sceneThumbPath(value, 256),
              sceneThumbPath(value, 512),
              sceneRefPath(value),
            ];
            references.push(...variants.map((variant) => ({ label, value: variant })));
          }
        }
      }
    } catch (error) {
      errors.push(`${spec.file}: ${error.message}`);
    }
  }
  if (new Set(materialIds).size !== materialIds.length)
    errors.push(
      'constants/tryOnMaterials.json: duplicate material ids would overwrite route shells',
    );
  return { references, materialIds, textOnlyScenes, errors };
}

export function validateHtmlCsp(html, label = 'HTML') {
  // Parse without loading resources or running scripts. Templates/comments/raw text
  // must never count as an effective browser policy.
  const dom = new JSDOM(html);
  try {
    const { document, Node } = dom.window;
    const metas = [...document.querySelectorAll('meta[http-equiv]')].filter(
      (meta) =>
        meta.getAttribute('http-equiv').toLowerCase() === 'content-security-policy' &&
        !meta.closest('noscript'),
    );
    if (metas.length !== 1)
      return [`${label}: expected exactly one CSP meta, found ${metas.length}`];
    const meta = metas[0];
    const errors = [];
    if (meta.getAttribute('content') !== CONTENT_SECURITY_POLICY)
      errors.push(`${label}: CSP differs from constants/csp.mjs`);
    const script = document.querySelector('script');
    if (
      !document.head.contains(meta) ||
      (script && script.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING)
    )
      errors.push(`${label}: CSP meta must appear in head before scripts`);
    return errors;
  } finally {
    dom.window.close();
  }
}

export function checkMaterialSources({
  root = REPO_ROOT,
  built = false,
  distDir = path.join(root, 'dist'),
} = {}) {
  const inventory = collectAssetReferences(root);
  const errors = [...validateNetworkSources(), ...inventory.errors, ...validatePoseStudy(root)];
  for (const reference of inventory.references)
    errors.push(
      ...validateAssetReference(reference.value, {
        publicDir: path.join(root, 'public'),
        label: reference.label,
        directives: ['img-src', 'connect-src'],
        localOnly: true,
      }),
    );
  try {
    errors.push(
      ...validateHtmlCsp(readFileSync(path.join(root, 'index.html'), 'utf8'), 'index.html'),
    );
  } catch (error) {
    errors.push(`index.html: ${error.message}`);
  }
  let checkedHtml = 0;
  if (built) {
    errors.push(...validatePoseStudy(root, distDir));
    for (const reference of inventory.references)
      errors.push(
        ...validateAssetReference(reference.value, {
          publicDir: distDir,
          label: `dist asset ${reference.label}`,
          localOnly: true,
        }),
      );
    const expected = [
      '404.html',
      ...listSeoRoutes().map(outputPathForRoute),
      ...inventory.materialIds.map((id) => `materials/${id}/index.html`),
    ];
    for (const relative of expected)
      if (!existsSync(path.join(distDir, relative)))
        errors.push(`dist/${relative}: missing route shell; run the complete build`);
    for (const relative of expected) {
      const file = path.join(distDir, relative);
      if (!existsSync(file) || !statSync(file).isFile()) continue;
      checkedHtml++;
      errors.push(...validateHtmlCsp(readFileSync(file, 'utf8'), `dist/${relative}`));
    }
  }
  return {
    errors,
    checkedAssets: inventory.references.length,
    checkedHtml,
    textOnlyScenes: inventory.textOnlyScenes,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const unknown = process.argv.slice(2).filter((arg) => arg !== '--built');
  if (unknown.length) {
    console.error(`check:csp: unknown argument ${unknown.join(' ')}`);
    process.exitCode = 1;
  } else {
    const result = checkMaterialSources({ built: process.argv.includes('--built') });
    if (result.errors.length) {
      console.error(`check:csp failed:\n${result.errors.map((error) => `- ${error}`).join('\n')}`);
      process.exitCode = 1;
    } else {
      for (const scene of result.textOnlyScenes) console.log(`check:csp: text-only scene ${scene}`);
      console.log(
        `check:csp passed: ${result.checkedAssets} catalog asset references${result.checkedHtml ? `, ${result.checkedHtml} HTML shells` : ''}`,
      );
    }
  }
}
