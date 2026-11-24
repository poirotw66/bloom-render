import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildHistoryArchive } from './historyArchive';
import type { StoredHistoryItem } from './historyDb';

function record(options: Record<string, unknown> = {}): StoredHistoryItem {
  return {
    id: '../../private',
    type: 'tryon',
    timestamp: 42,
    blob: new Blob(['result bytes'], { type: 'image/webp' }),
    sourceBlob: new Blob(['person bytes'], { type: 'image/png' }),
    references: [
      {
        role: 'clothing',
        blob: new Blob(['shirt bytes'], { type: 'image/jpeg' }),
        name: '../../shirt.jpg',
      },
      {
        role: 'pose',
        blob: new Blob(['pose bytes'], { type: 'image/svg+xml' }),
        name: 'pose.svg',
        materialId: 'pose-standing',
      },
    ],
    options,
  };
}

const recipe = {
  v: 1,
  kind: 'tryon',
  materialIds: ['pose-standing'],
  settings: {
    background: 'studio',
    style: 'editorial_high',
    outputSize: '1K',
    aspectRatio: '9:16',
    quantity: 2,
    keepBackground: true,
    keepPose: false,
  },
};

describe('history archive', () => {
  it('exports exact output, source, references and portable generation metadata together', async () => {
    const blob = await buildHistoryArchive(
      [
        record({
          provider: 'gemini',
          model: 'test-model',
          clothingCount: 1,
          prompt: 'Use the first image as the person.',
          keepBackground: true,
          outputSize: '4K',
          effectiveOutputSize: '1K',
          recipe,
        }),
      ],
      new Date('2026-11-24T00:00:00Z'),
    );
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const manifest = JSON.parse(await zip.file('metadata.json')!.async('text'));
    expect(manifest).toMatchObject({
      app: 'BloomRender',
      version: 1,
      exportedAt: '2026-11-24T00:00:00.000Z',
    });
    const entry = manifest.records[0];
    expect(entry.options.recipe).toEqual(recipe);
    expect(entry.options.outputSize).toBe('4K');
    expect(entry.options.effectiveOutputSize).toBe('1K');
    expect(entry.inputsComplete).toBe(true);
    expect(entry.references.map((ref: { role: string }) => ref.role)).toEqual(['clothing', 'pose']);
    expect(await zip.file(entry.output)!.async('text')).toBe('result bytes');
    expect(await zip.file(entry.source)!.async('text')).toBe('person bytes');
    expect(await zip.file(entry.references[0].file)!.async('text')).toBe('shirt bytes');
    expect(await zip.file(entry.references[1].file)!.async('text')).toBe('pose bytes');
    expect(Object.keys(zip.files).every((path) => !path.includes('..'))).toBe(true);
  });

  it('does not export credentials, runtime URLs, unknown options or invalid recipes', async () => {
    const blob = await buildHistoryArchive([
      record({
        apiKey: 'secret-key',
        credentials: { key: 'nested-secret' },
        config: { apiKey: 'nested-secret' },
        model: 'model',
        prompt:
          'Photo blob:https://example.test/private data:image/png;base64,SECRET sk-proj-12345678901234567890',
        recipe: { ...recipe, apiKey: 'recipe-secret' },
        internalBlob: new Blob(['sensitive']),
      }),
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const text = await zip.file('metadata.json')!.async('text');
    expect(text).not.toMatch(
      /secret-key|nested-secret|recipe-secret|SECRET|blob:|data:image|sk-proj/,
    );
    const options = JSON.parse(text).records[0].options;
    expect(Object.keys(options).sort()).toEqual(['model', 'prompt']);
  });

  it('exports old results with honest input completeness and no fabricated source or recipe', async () => {
    const legacy = record({ clothingCount: 2 });
    delete legacy.sourceBlob;
    delete legacy.references;
    const blob = await buildHistoryArchive([legacy]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const entry = JSON.parse(await zip.file('metadata.json')!.async('text')).records[0];
    expect(entry.inputsComplete).toBe(false);
    expect(entry.references).toEqual([]);
    expect(entry).not.toHaveProperty('source');
    expect(entry.options).not.toHaveProperty('recipe');
    expect(await zip.file(entry.output)!.async('text')).toBe('result bytes');
  });
});
