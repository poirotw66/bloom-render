import { describe, expect, it } from 'vitest';
import { TRYON_MATERIALS } from './tryOnMaterials';
import {
  parsePoseReference,
  getPairedPoseReference,
  getPoseAlternatives,
  getPoseVariant,
  validatePoseReferences,
} from './poseReferences.mjs';
const material = (id: string) => TRYON_MATERIALS.find((item) => item.id === id)!;
const front = material('standing-study-front-lineart');

describe('pose view and representation identity', () => {
  it('offers real views from the same pose and preserves the chosen representation', () => {
    const depth = material('standing-study-profile-depth');
    const alternatives = getPoseAlternatives(depth, TRYON_MATERIALS);
    expect(alternatives.map((item) => item.pose!.view)).toEqual([
      'front',
      'three-quarter',
      'profile',
      'back',
    ]);
    expect(alternatives.every((item) => item.poseReference?.representation === 'depth')).toBe(true);
    expect(getPoseVariant(depth, TRYON_MATERIALS, { view: 'back' })?.id).toBe(
      'standing-study-back-depth',
    );
    expect(getPoseVariant(depth, TRYON_MATERIALS, { representation: 'lineart' })?.id).toBe(
      'standing-study-profile-lineart',
    );
    expect(getPairedPoseReference(depth, TRYON_MATERIALS)?.id).toBe(
      'standing-study-profile-lineart',
    );
  });
  it('does not invent missing paired images or views for legacy material IDs', () => {
    const legacy = material('pose-hand-on-hip');
    expect(getPairedPoseReference(legacy, TRYON_MATERIALS)).toBeNull();
    expect(getPoseAlternatives(legacy, TRYON_MATERIALS).map((item) => item.id)).toEqual([
      legacy.id,
    ]);
    expect(getPoseVariant(legacy, TRYON_MATERIALS, { view: 'back' })).toBeUndefined();
  });
  it('rejects orphaned, duplicated or differently framed pair members', () => {
    expect(validatePoseReferences(TRYON_MATERIALS)).toEqual([]);
    expect(validatePoseReferences([front]).join(' ')).toContain(
      'exactly one lineart and one depth',
    );
    const depth = material('standing-study-front-depth');
    expect(
      validatePoseReferences([front, { ...depth, pose: { ...depth.pose!, view: 'back' } }]).join(
        ' ',
      ),
    ).toContain('identical pose and camera metadata');
    expect(validatePoseReferences([front, { ...depth, image: front.image }]).join(' ')).toContain(
      'distinct images',
    );
  });
  it.each([
    null,
    {},
    { pairId: '../escape', representation: 'depth' },
    { pairId: 'pair', representation: 'photo' },
    { pairId: 'pair', representation: 'depth', extra: true },
  ])('rejects invalid pair descriptors %j', (value) => {
    expect(parsePoseReference(value)).toBeNull();
  });
});

describe('expanded pose studies', () => {
  it.each(['hand-on-hip-study', 'seated-study'])(
    'keeps %s camera alternatives within its own pose group',
    (group) => {
      const selected = material(`${group}-profile-depth`);
      const alternatives = getPoseAlternatives(selected, TRYON_MATERIALS);
      expect(alternatives.map((item) => item.id)).toEqual(
        ['front', 'three-quarter', 'profile', 'back'].map((view) => `${group}-${view}-depth`),
      );
      expect(getPairedPoseReference(selected, TRYON_MATERIALS)?.id).toBe(
        `${group}-profile-lineart`,
      );
      expect(
        getPoseVariant(selected, TRYON_MATERIALS, { view: 'back', representation: 'lineart' })?.id,
      ).toBe(`${group}-back-lineart`);
      expect(alternatives.every((item) => item.pose?.groupId === group)).toBe(true);
      expect(selected.pose?.posture).toBe(group === 'seated-study' ? 'seated' : 'standing');
    },
  );
});
