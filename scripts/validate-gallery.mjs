/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Validate gallery/*.json community prompt entries against gallery/schema.json
 * and confirm each thumbnail exists under public/.
 *
 * Usage: node scripts/validate-gallery.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const galleryDir = path.join(root, 'gallery');
const schemaPath = path.join(galleryDir, 'schema.json');
const publicDir = path.join(root, 'public');

function fail(message) {
  console.error(`gallery:validate ✗ ${message}`);
  process.exitCode = 1;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateEntry(entry, schema, fileName) {
  const errors = [];
  const required = schema.required ?? [];
  for (const key of required) {
    if (!(key in entry)) errors.push(`missing required "${key}"`);
  }

  const props = schema.properties ?? {};
  for (const [key, value] of Object.entries(entry)) {
    const prop = props[key];
    if (!prop) {
      errors.push(`unknown property "${key}"`);
      continue;
    }
    if (prop.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`"${key}" must be a string`);
        continue;
      }
      if (typeof prop.minLength === 'number' && value.length < prop.minLength) {
        errors.push(`"${key}" shorter than minLength ${prop.minLength}`);
      }
      if (typeof prop.maxLength === 'number' && value.length > prop.maxLength) {
        errors.push(`"${key}" longer than maxLength ${prop.maxLength}`);
      }
      if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
        errors.push(`"${key}" does not match pattern ${prop.pattern}`);
      }
      if (prop.enum && !prop.enum.includes(value)) {
        errors.push(`"${key}" must be one of ${prop.enum.join(', ')}`);
      }
    } else if (prop.type === 'object') {
      if (!isObject(value)) {
        errors.push(`"${key}" must be an object`);
        continue;
      }
      const childProps = prop.properties ?? {};
      for (const [childKey, childValue] of Object.entries(value)) {
        const childProp = childProps[childKey];
        if (!childProp) {
          errors.push(`settings.${childKey} is not allowed`);
          continue;
        }
        if (childProp.type === 'string') {
          if (typeof childValue !== 'string') {
            errors.push(`settings.${childKey} must be a string`);
          } else if (childProp.enum && !childProp.enum.includes(childValue)) {
            errors.push(`settings.${childKey} must be one of ${childProp.enum.join(', ')}`);
          }
        } else if (childProp.type === 'integer') {
          if (!Number.isInteger(childValue)) {
            errors.push(`settings.${childKey} must be an integer`);
          } else {
            if (typeof childProp.minimum === 'number' && childValue < childProp.minimum) {
              errors.push(`settings.${childKey} below minimum`);
            }
            if (typeof childProp.maximum === 'number' && childValue > childProp.maximum) {
              errors.push(`settings.${childKey} above maximum`);
            }
          }
        }
      }
    } else if (prop.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`"${key}" must be an array`);
        continue;
      }
      if (typeof prop.maxItems === 'number' && value.length > prop.maxItems) {
        errors.push(`"${key}" has more than ${prop.maxItems} items`);
      }
      if (prop.uniqueItems) {
        const seen = new Set(value);
        if (seen.size !== value.length) errors.push(`"${key}" must have unique items`);
      }
      const item = prop.items;
      if (item?.type === 'string') {
        for (const [i, v] of value.entries()) {
          if (typeof v !== 'string') errors.push(`"${key}[${i}]" must be a string`);
          else {
            if (typeof item.minLength === 'number' && v.length < item.minLength) {
              errors.push(`"${key}[${i}]" too short`);
            }
            if (typeof item.maxLength === 'number' && v.length > item.maxLength) {
              errors.push(`"${key}[${i}]" too long`);
            }
          }
        }
      }
    }
  }

  const base = path.basename(fileName, '.json');
  if (typeof entry.id === 'string' && entry.id !== base) {
    errors.push(`id "${entry.id}" must match filename "${base}.json"`);
  }

  if (typeof entry.thumbnail === 'string') {
    const thumbPath = path.join(publicDir, entry.thumbnail);
    if (!fs.existsSync(thumbPath)) {
      errors.push(`thumbnail not found at public/${entry.thumbnail}`);
    }
  }

  return errors;
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
    const errors = validateEntry(entry, schema, file);
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
