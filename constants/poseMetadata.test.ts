import { describe, expect, it } from 'vitest';
import {
  getMaterialPrompt,
  getPoseMetadataLabel,
  getPoseSearchText,
  isValidMaterialPose,
  matchesPoseFilters,
  parsePoseMetadata,
} from './poseMetadata.mjs';
import { TRYON_MATERIALS } from './tryOnMaterials';

const metadata = {
  groupId: 'relaxed-standing',
  posture: 'standing',
  view: 'front',
  cameraHeight: 'unspecified',
  framing: 'full-body',
} as const;

describe('structured pose metadata', () => {
  it('enriches only the existing pose references without changing catalog identity', () => {
    expect(TRYON_MATERIALS).toHaveLength(8);
    expect(
      TRYON_MATERIALS.filter((material) => material.pose).map((material) => material.id),
    ).toEqual(['pose-relaxed-front', 'pose-hand-on-hip', 'pose-seated-profile']);
    for (const material of TRYON_MATERIALS) expect(isValidMaterialPose(material)).toBe(true);
    expect(isValidMaterialPose({ role: 'pose' })).toBe(false);
    expect(isValidMaterialPose({ role: 'clothing', pose: metadata })).toBe(false);
  });

  it.each([
    null,
    Object.create(metadata),
    { ...metadata, groupId: '../private' },
    { ...metadata, posture: 'unsupported' },
    { ...metadata, view: 45 },
    { ...metadata, cameraHeight: 'precisely-170cm' },
    { ...metadata, framing: 'unsupported' },
    { ...metadata, yaw: 45 },
    { groupId: 'seated', posture: 'seated', view: 'profile', framing: 'full-body' },
  ])('rejects malformed and unverified metadata %j', (value) => {
    expect(parsePoseMetadata(value)).toBeNull();
  });

  it('keeps unknown camera height explicit in metadata and out of model instructions', () => {
    const material = TRYON_MATERIALS.find((item) => item.id === 'pose-seated-profile')!;
    const prompt = getMaterialPrompt(material);
    expect(prompt).toContain(material.prompt);
    expect(prompt).toContain('Pose and camera: posture=seated; view=profile; framing=full-body.');
    expect(prompt).not.toContain('cameraHeight=');
    expect(prompt).not.toContain('eye-level');
    expect(getPoseMetadataLabel('cameraHeight', 'unspecified', 'zh-TW')).toBe('未標示');
    expect(getPoseMetadataLabel('cameraHeight', 'unspecified', 'en')).toBe('Not specified');
  });

  it('uses known camera height only when it was explicitly supplied', () => {
    const prompt = getMaterialPrompt({
      role: 'pose',
      prompt: 'Reference.',
      pose: { ...metadata, cameraHeight: 'high-angle' },
    });
    expect(prompt).toContain('cameraHeight=high-angle');
  });

  it('leaves non-pose material prompts unchanged', () => {
    for (const material of TRYON_MATERIALS.filter((item) => item.role !== 'pose'))
      expect(getMaterialPrompt(material)).toBe(material.prompt);
  });

  it('supports bilingual discovery and deterministic filters without changing selections', () => {
    const seated = TRYON_MATERIALS.find((item) => item.id === 'pose-seated-profile')!;
    const ids = TRYON_MATERIALS.map((item) => item.id);
    expect(getPoseSearchText(seated)).toContain('坐姿');
    expect(getPoseSearchText(seated)).toContain('Profile');
    expect(
      TRYON_MATERIALS.filter((item) =>
        matchesPoseFilters(item, { posture: 'seated', view: 'profile' }),
      ).map((item) => item.id),
    ).toEqual([seated.id]);
    expect(
      TRYON_MATERIALS.filter((item) =>
        matchesPoseFilters(item, { posture: 'seated', view: 'front' }),
      ),
    ).toEqual([]);
    expect(matchesPoseFilters(TRYON_MATERIALS[0], { posture: 'standing' })).toBe(false);
    expect(TRYON_MATERIALS.map((item) => item.id)).toEqual(ids);
    expect(matchesPoseFilters(seated, { groupId: 'seated', cameraHeight: 'unspecified' })).toBe(
      true,
    );
  });
});
