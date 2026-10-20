// @vitest-environment jsdom
/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  SAVED_PROMPTS_EXPORT_VERSION,
  applySavedPromptsImport,
  buildSavedPromptsExport,
  parseSavedPromptsImport,
  savePromptToScope,
  stringifySavedPromptsExport,
} from './savedPromptsIo';

describe('savedPromptsIo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips export JSON through parse + merge import', () => {
    savePromptToScope('generate', 'Neon alley at night');
    savePromptToScope('retouch', 'Make the jacket red');

    const exported = buildSavedPromptsExport();
    expect(exported.version).toBe(SAVED_PROMPTS_EXPORT_VERSION);
    expect(exported.scopes.generate?.map((p) => p.text)).toContain('Neon alley at night');

    const raw = stringifySavedPromptsExport(exported);
    localStorage.clear();
    const parsed = parseSavedPromptsImport(raw);
    applySavedPromptsImport(parsed, 'merge');

    const again = buildSavedPromptsExport();
    expect(again.scopes.generate?.[0]?.text).toBe('Neon alley at night');
    expect(again.scopes.retouch?.[0]?.text).toBe('Make the jacket red');
  });

  it('rejects unsupported versions', () => {
    expect(() => parseSavedPromptsImport(JSON.stringify({ version: 99, scopes: {} }))).toThrowError(
      'unsupported_version',
    );
  });
});
