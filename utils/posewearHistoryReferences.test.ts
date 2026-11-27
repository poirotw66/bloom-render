import { describe, expect, it } from 'vitest';
import { buildHistoryReferenceTrace } from './posewearHistoryReferences';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import type { HistoryReference } from '../types/tryOnRecipe';
const image = () => new Blob(['image'], { type: 'image/png' });
describe('history input reference tracing', () => {
  it('preserves original person and saved reference order with local blob priority', () => {
    const person = image();
    const first = TRYON_MATERIALS.find((entry) => entry.role === 'pose')!;
    const blob = image();
    const refs = buildHistoryReferenceTrace({
      sourceBlob: person,
      references: [
        { role: 'pose', name: 'Exact depth view', blob, materialId: first.id },
        { role: 'clothing', name: 'Uploaded shirt', blob: image() },
      ],
    });
    expect(refs.map((ref) => ref.role)).toEqual(['person', 'pose', 'clothing']);
    expect(refs.map((ref) => ref.slot)).toEqual([1, 2, 3]);
    expect(refs[1]).toMatchObject({ source: 'stored', blob, materialId: first.id });
  });
  it('uses only exact, role-matched trusted catalog IDs for a missing snapshot', () => {
    const material = TRYON_MATERIALS[0];
    const refs = buildHistoryReferenceTrace({
      references: [
        { role: material.role, materialId: material.id, name: '' },
        { role: 'pose', materialId: 'https://untrusted.example/image', name: '' },
        { role: 'pose', materialId: material.id, name: '' },
      ] as HistoryReference[],
    });
    expect(refs[0]).toMatchObject({ source: 'catalog', catalogImage: material.image });
    expect(refs[1]).toMatchObject({ source: 'missing' });
    expect(refs[1].materialId).toBeUndefined();
    expect(refs[2].materialId).toBeUndefined();
  });
  it('resolves recipe-only legacy records to explicitly marked trusted catalog previews', () => {
    const material = TRYON_MATERIALS[0];
    const refs = buildHistoryReferenceTrace({
      options: {
        recipe: {
          v: 1,
          kind: 'tryon',
          materialIds: [material.id, 'unknown-material'],
          settings: {
            background: 'studio',
            style: 'editorial_high',
            quantity: 1,
            outputSize: '1K',
            aspectRatio: '9:16',
            keepBackground: true,
            keepPose: true,
          },
        },
      },
    });
    expect(refs).toEqual([
      {
        slot: 1,
        role: material.role,
        name: '',
        materialId: material.id,
        catalogImage: material.image,
        source: 'catalog',
      },
    ]);
  });
  it('does not invent original input images for legacy or malformed records', () => {
    expect(buildHistoryReferenceTrace({})).toEqual([]);
    expect(
      buildHistoryReferenceTrace({
        references: [null, { blob: 'https://bad.example' }] as unknown as HistoryReference[],
      }),
    ).toEqual([{ slot: 1, role: 'reference', name: '', source: 'missing' }]);
  });
});
