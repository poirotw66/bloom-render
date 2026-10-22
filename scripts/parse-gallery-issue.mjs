/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Parse a GitHub issue-form body for prompt gallery submissions into an entry
 * object, then validate with the same rules as validate-gallery.mjs.
 *
 * Usage:
 *   node scripts/parse-gallery-issue.mjs --body-file path.txt
 *   echo "$BODY" | node scripts/parse-gallery-issue.mjs
 *
 * Exit 0 + JSON on stdout when valid; exit 1 with errors on stderr.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEntryObject } from './gallery-entry-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'gallery/schema.json'), 'utf8'));

function readBody() {
  const idx = process.argv.indexOf('--body-file');
  if (idx !== -1 && process.argv[idx + 1]) {
    return fs.readFileSync(process.argv[idx + 1], 'utf8');
  }
  return fs.readFileSync(0, 'utf8');
}

/**
 * Extract `### Label\n\nvalue` sections from an issue-form body.
 * @param {string} body
 * @returns {Record<string, string>}
 */
export function parseIssueFormBody(body) {
  /** @type {Record<string, string>} */
  const sections = {};
  const parts = String(body).split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    const label = part.slice(0, nl).trim();
    let value = part.slice(nl + 1).trim();
    if (value === '_No response_' || value === '') value = '';
    sections[label] = value;
  }
  return sections;
}

function noneToEmpty(value) {
  if (!value || value === '(none)') return '';
  return value.trim();
}

/**
 * @param {Record<string, string>} sections
 * @returns {{
 *   id: string,
 *   title: string,
 *   titleZh: string,
 *   prompt: string,
 *   feature: string,
 *   settings: Record<string, string | number>,
 *   thumbnail?: string,
 *   author?: string,
 *   description?: string,
 *   descriptionZh?: string,
 *   tags?: string[],
 *   tagsZh?: string[],
 * }}
 */
export function entryFromIssueSections(sections) {
  const id = (sections.id || sections.Id || '').trim();
  const title = (sections.title || sections.Title || '').trim();
  const titleZh = (sections.titleZh || sections.TitleZh || '').trim();
  const prompt = (sections.prompt || sections.Prompt || '').trim();
  const feature = (sections.feature || sections.Feature || '').trim();
  const thumbnail = noneToEmpty(sections.thumbnail || sections.Thumbnail || '');
  const author = noneToEmpty(sections.author || sections.Author || '');
  const description = noneToEmpty(sections.description || sections.Description || '');
  const descriptionZh = noneToEmpty(sections.descriptionZh || sections.DescriptionZh || '');
  const tagsRaw = noneToEmpty(sections.tags || sections.Tags || '');
  const tagsZhRaw = noneToEmpty(sections.tagsZh || sections.TagsZh || '');

  const aspect = noneToEmpty(
    sections['settings.aspectRatio (optional)'] || sections.aspect_ratio || '',
  );
  const quantityRaw = noneToEmpty(
    sections['settings.quantity (optional, generate)'] || sections.quantity || '',
  );
  const tab = noneToEmpty(
    sections['settings.tab (optional, editor surfaces)'] || sections.tab || '',
  );

  /** @type {Record<string, string | number>} */
  const settings = {};
  if (aspect) settings.aspectRatio = aspect;
  if (quantityRaw) settings.quantity = Number(quantityRaw);
  if (tab) settings.tab = tab;

  /** @type {{
   *   id: string,
   *   title: string,
   *   titleZh: string,
   *   prompt: string,
   *   feature: string,
   *   settings: Record<string, string | number>,
   *   thumbnail?: string,
   *   author?: string,
   *   description?: string,
   *   descriptionZh?: string,
   *   tags?: string[],
   *   tagsZh?: string[],
   * }} */
  const entry = { id, title, titleZh, prompt, feature, settings };
  if (thumbnail) entry.thumbnail = thumbnail;
  if (author) entry.author = author;
  if (description) entry.description = description;
  if (descriptionZh) entry.descriptionZh = descriptionZh;
  if (tagsRaw) {
    entry.tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (tagsZhRaw) {
    entry.tagsZh = tagsZhRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return entry;
}

function main() {
  const body = readBody();
  const sections = parseIssueFormBody(body);
  const entry = entryFromIssueSections(sections);
  const errors = validateEntryObject(entry, schema, `${entry.id || 'submission'}.json`, {
    requireFileMatch: false,
    checkThumbnailExists: true,
  });
  if (errors.length > 0) {
    for (const err of errors) console.error(`gallery-issue ✗ ${err}`);
    process.exit(1);
  }
  console.log(JSON.stringify(entry, null, 2));
}

const invokedAsScript =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  main();
}
