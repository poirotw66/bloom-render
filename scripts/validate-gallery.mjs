/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Validate gallery/*.json community prompt entries against gallery/schema.json
 * and confirm each thumbnail exists under public/ when provided.
 *
 * Usage: node scripts/validate-gallery.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEntryObject } from './gallery-entry-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const galleryDir = path.join(root, 'gallery');
const schemaPath = path.join(galleryDir, 'schema.json');

function fail(message) {
  console.error(`gallery:validate ✗ ${message}`);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(schemaPath)) {
    fail(`schema missing: ${schemaPath}`);
    return;
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const files = fs
    .readdirSync(galleryDir)
    .filter((name) => name.endsWith('.json') && name !== 'schema.json')
    .sort();

  if (files.length === 0) {
    fail('no gallery entries found');
    return;
  }

  let ok = 0;
  for (const file of files) {
    const full = path.join(galleryDir, file);
    let entry;
    try {
      entry = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (err) {
      fail(`${file}: invalid JSON (${err instanceof Error ? err.message : err})`);
      continue;
    }
    const errors = validateEntryObject(entry, schema, file);
    if (errors.length > 0) {
      for (const error of errors) fail(`${file}: ${error}`);
    } else {
      ok += 1;
      console.log(`gallery:validate ✓ ${file}`);
    }
  }

  if (process.exitCode) {
    console.error(`gallery:validate failed (${ok}/${files.length} ok)`);
  } else {
    console.log(`gallery:validate passed (${ok} entries)`);
  }
}

main();
