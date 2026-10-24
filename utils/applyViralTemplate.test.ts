/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getViralTemplateById } from '../constants/viralTemplates';
import {
  remixPayloadForTemplate,
  remixToEditorPreset,
  remixToGeneratePreset,
  remixUrlForTemplate,
  resolveRemixToTemplate,
} from './applyViralTemplate';
import { clearPendingRemix } from './pendingRemix';
import { decodeRemixPayload, encodeRemixPayload } from './remixLink';

afterEach(() => {
  clearPendingRemix();
  vi.restoreAllMocks();
});

describe('applyViralTemplate helpers', () => {
  it('builds short id payloads and remix URLs', () => {
    const template = getViralTemplateById('figurine-box')!;
    const payload = remixPayloadForTemplate(template);
    expect(payload).toEqual({ v: 1, id: 'figurine-box' });
    const encoded = encodeRemixPayload(payload);
    expect(encoded.length).toBeLessThan(80);
    expect(decodeRemixPayload(encoded)).toEqual(payload);
    expect(remixUrlForTemplate(template)).toContain('/r#');
  });

  it('maps template remix to editor preset', () => {
    const template = getViralTemplateById('polaroid-frame')!;
    expect(resolveRemixToTemplate({ v: 1, id: template.id })).toEqual(template);
    expect(remixToEditorPreset({ v: 1, id: template.id })).toEqual({
      prompt: template.prompt,
      tab: 'retouch',
      viralTemplateId: template.id,
    });
    expect(remixToGeneratePreset({ v: 1, id: template.id })).toBeNull();
  });

  it('maps prompt-form generate payload', () => {
    const preset = remixToGeneratePreset({
      v: 1,
      f: 'generate',
      p: 'neon alley',
      a: '3:4',
      q: 2,
    });
    expect(preset).toEqual({ prompt: 'neon alley', aspectRatio: '3:4', quantity: 2 });
  });

  it('returns null for unknown template ids', () => {
    expect(resolveRemixToTemplate({ v: 1, id: 'not-a-real-template' })).toBeNull();
  });
});
