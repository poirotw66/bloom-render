/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getViralTemplateById, type ViralTemplate } from '../constants/viralTemplates';
import { ROUTES } from '../constants/routes';
import {
  applyViralTemplate,
  remixPayloadForTemplate,
  remixToEditorPreset,
  remixToGeneratePreset,
  remixUrlForTemplate,
  resolveRemixToTemplate,
  resolveViralApplyTarget,
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

  it('routes multi-person templates to multi-person target', () => {
    expect(resolveViralApplyTarget(getViralTemplateById('graduation-group')!)).toBe('multi-person');
    expect(resolveViralApplyTarget(getViralTemplateById('couple-portrait')!)).toBe('multi-person');
    expect(resolveViralApplyTarget(getViralTemplateById('figurine-box')!)).toBe('edit');
  });
});

describe('applyViralTemplate navigation', () => {
  it('navigates single-person (keyed) to /edit awaitUpload with template id', async () => {
    const navigate = vi.fn();
    const template = getViralTemplateById('figurine-box')!;
    await applyViralTemplate(template, navigate, { demoMode: false });
    expect(navigate).toHaveBeenCalledWith(ROUTES.EDIT, {
      state: {
        awaitUpload: true,
        galleryPreset: {
          prompt: template.prompt,
          tab: 'retouch',
          viralTemplateId: 'figurine-box',
        },
      },
    });
  });

  it('navigates multi-person templates to /multi-person with templateId', async () => {
    const navigate = vi.fn();
    const template = getViralTemplateById('camping-friends')!;
    await applyViralTemplate(template, navigate, { demoMode: false });
    expect(navigate).toHaveBeenCalledWith(ROUTES.MULTI_PERSON, {
      state: { templateId: 'camping-friends' },
    });
  });

  it('navigates generate-feature templates to /generate with preset', async () => {
    const navigate = vi.fn();
    const base = getViralTemplateById('figurine-box')!;
    const generateTemplate = {
      ...base,
      id: 'figurine-box',
      feature: 'generate',
      aspectRatio: '3:4',
      quantity: 2,
    } as ViralTemplate;
    // feature generate wins only when not multi-person
    Object.assign(generateTemplate, { supportsMultiPerson: undefined });
    await applyViralTemplate(generateTemplate, navigate, { demoMode: false });
    expect(navigate).toHaveBeenCalledWith(ROUTES.GENERATE, {
      state: {
        galleryPreset: {
          prompt: generateTemplate.prompt,
          aspectRatio: '3:4',
          quantity: 2,
          viralTemplateId: 'figurine-box',
        },
      },
    });
  });

  it('demo single-person loads the template thumbnail into /edit', async () => {
    const navigate = vi.fn();
    const template = getViralTemplateById('christmas-cozy')!;
    const fetchMock = vi.fn(async () => {
      const bytes = Uint8Array.from([1, 2, 3]);
      return new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/webp' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    await applyViralTemplate(template, navigate, { demoMode: true });

    expect(fetchMock).toHaveBeenCalled();
    const callArgs = fetchMock.mock.calls as unknown as Array<[unknown]>;
    const firstUrl = callArgs.map((c) => String(c[0])).join(' ');
    expect(firstUrl).toContain('examples/viral/christmas-cozy.webp');
    expect(navigate).toHaveBeenCalledWith(
      ROUTES.EDIT,
      expect.objectContaining({
        state: expect.objectContaining({
          initialFile: expect.any(File),
          galleryPreset: expect.objectContaining({
            viralTemplateId: 'christmas-cozy',
          }),
        }),
      }),
    );
  });
});
