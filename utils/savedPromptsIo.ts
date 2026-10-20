/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Export / import saved prompt chips (all scopes) as JSON.
 */

import {
  MAX_SAVED_PROMPTS,
  normalizePromptText,
  type SavedPrompt,
  withSavedPrompt,
} from '../hooks/useSavedPrompts';
import { logger } from './logger';

export const SAVED_PROMPTS_EXPORT_VERSION = 1 as const;

/** Scopes that use SavedPromptsBar today. */
export const SAVED_PROMPT_SCOPES = ['generate', 'retouch', 'adjust', 'filter'] as const;
export type SavedPromptScope = (typeof SAVED_PROMPT_SCOPES)[number];

const STORAGE_PREFIX = 'bloomrender_saved_prompts_';

export interface SavedPromptsExportFile {
  version: typeof SAVED_PROMPTS_EXPORT_VERSION;
  exportedAt: string;
  scopes: Partial<Record<SavedPromptScope, SavedPrompt[]>>;
}

function storageKeyFor(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

function isSavedPrompt(value: unknown): value is SavedPrompt {
  if (!value || typeof value !== 'object') return false;
  const v = value as SavedPrompt;
  return typeof v.id === 'string' && typeof v.text === 'string' && typeof v.createdAt === 'number';
}

function readScope(scope: SavedPromptScope): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(scope));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedPrompt);
  } catch (err) {
    logger.error('Failed to read saved prompts for export:', err);
    return [];
  }
}

function writeScope(scope: string, prompts: SavedPrompt[]): void {
  localStorage.setItem(storageKeyFor(scope), JSON.stringify(prompts.slice(0, MAX_SAVED_PROMPTS)));
}

/** Snapshot every known scope into a portable JSON document. */
export function buildSavedPromptsExport(): SavedPromptsExportFile {
  const scopes: SavedPromptsExportFile['scopes'] = {};
  for (const scope of SAVED_PROMPT_SCOPES) {
    scopes[scope] = readScope(scope);
  }
  return {
    version: SAVED_PROMPTS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    scopes,
  };
}

export function stringifySavedPromptsExport(
  data: SavedPromptsExportFile = buildSavedPromptsExport(),
): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/**
 * Parse and lightly validate an imported JSON document.
 * Unknown scopes are ignored; malformed prompts are skipped.
 */
export function parseSavedPromptsImport(raw: string): SavedPromptsExportFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('invalid_json');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid_shape');
  const doc = parsed as Record<string, unknown>;
  if (doc.version !== SAVED_PROMPTS_EXPORT_VERSION) throw new Error('unsupported_version');
  if (!doc.scopes || typeof doc.scopes !== 'object') throw new Error('invalid_scopes');

  const scopes: SavedPromptsExportFile['scopes'] = {};
  for (const scope of SAVED_PROMPT_SCOPES) {
    const list = (doc.scopes as Record<string, unknown>)[scope];
    if (!Array.isArray(list)) continue;
    const prompts: SavedPrompt[] = [];
    for (const item of list) {
      if (!isSavedPrompt(item)) continue;
      const text = normalizePromptText(item.text);
      if (!text) continue;
      prompts.push({ ...item, text });
    }
    scopes[scope] = prompts;
  }

  return {
    version: SAVED_PROMPTS_EXPORT_VERSION,
    exportedAt: typeof doc.exportedAt === 'string' ? doc.exportedAt : new Date().toISOString(),
    scopes,
  };
}

export type ImportMode = 'merge' | 'replace';

/** Write imported prompts into localStorage. */
export function applySavedPromptsImport(
  data: SavedPromptsExportFile,
  mode: ImportMode = 'merge',
): void {
  for (const scope of SAVED_PROMPT_SCOPES) {
    const incoming = data.scopes[scope] ?? [];
    if (mode === 'replace') {
      writeScope(scope, incoming.slice(0, MAX_SAVED_PROMPTS));
      continue;
    }
    let merged = readScope(scope);
    for (const prompt of [...incoming].reverse()) {
      merged = withSavedPrompt(merged, prompt.text);
    }
    writeScope(scope, merged);
  }
}

/** Persist one prompt into a scope (used when applying a gallery preset). */
export function savePromptToScope(scope: string, text: string): void {
  const key = storageKeyFor(scope);
  let existing: SavedPrompt[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) existing = parsed.filter(isSavedPrompt);
    }
  } catch {
    existing = [];
  }
  writeScope(scope, withSavedPrompt(existing, text));
}

/** Trigger a browser download of the export JSON. */
export function downloadSavedPromptsExport(
  fileName = `bloomrender-prompts-${Date.now()}.json`,
): void {
  const blob = new Blob([stringifySavedPromptsExport()], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
