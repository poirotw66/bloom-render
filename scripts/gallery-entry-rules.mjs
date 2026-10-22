/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared gallery entry validation used by validate-gallery.mjs and the
 * gallery-submission GitHub Action.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {Record<string, unknown>} entry
 * @param {Record<string, unknown>} schema
 * @param {string} fileName
 * @param {{ requireFileMatch?: boolean, checkThumbnailExists?: boolean }} [opts]
 * @returns {string[]}
 */
export function validateEntryObject(entry, schema, fileName, opts = {}) {
  const requireFileMatch = opts.requireFileMatch !== false;
  const checkThumbnailExists = opts.checkThumbnailExists !== false;
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

  if (requireFileMatch) {
    const base = path.basename(fileName, '.json');
    if (typeof entry.id === 'string' && entry.id !== base) {
      errors.push(`id "${entry.id}" must match filename "${base}.json"`);
    }
  }

  if (checkThumbnailExists && typeof entry.thumbnail === 'string' && entry.thumbnail) {
    const thumbPath = path.join(publicDir, entry.thumbnail);
    if (!fs.existsSync(thumbPath)) {
      errors.push(`thumbnail not found at public/${entry.thumbnail}`);
    }
  }

  return errors;
}
