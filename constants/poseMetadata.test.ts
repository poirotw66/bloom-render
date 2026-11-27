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
  it('preserves legacy pose identities alongside the additional paired study views', () => {
    expect(
      TRYON_MATERIALS.filter((material) => material.pose && !material.poseReference).map(
        (material) => material.id,
      ),
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

  it('states the exact single view and representation semantics for paired references', () => {
    const depth = {
      role: 'pose',
      prompt: 'Synthetic standing reference.',
      pose: { ...metadata, groupId: 'standing-study', view: 'back', cameraHeight: 'eye-level' },
      poseReference: { pairId: 'standing-study-back', representation: 'depth' },
    };
    const prompt = getMaterialPrompt(depth);
    expect(prompt).toContain('view=back; cameraHeight=eye-level');
    expect(prompt).toContain('Reference representation=depth.');
    expect(prompt).toContain('lighter foreground surfaces are nearer');
    expect(prompt).toContain('black is background');
    expect(prompt).toContain('not measured human depth');
    expect(prompt).toContain('do not create a multi-view sheet or multiple panels');
    const lineart = {
      ...depth,
      poseReference: { ...depth.poseReference, representation: 'lineart' },
    };
    expect(getMaterialPrompt(lineart)).toContain('Reference representation=lineart.');
    expect(getMaterialPrompt(lineart)).not.toContain('lighter foreground surfaces');
    expect(getPoseSearchText(lineart)).toContain('線稿');
    expect(getPoseSearchText(depth)).toContain('Depth map');
    expect(getPoseMetadataLabel('view', 'back', 'zh-TW')).toBe('背面');
    expect(parsePoseMetadata(depth.pose)?.view).toBe('back');
    expect(
      getMaterialPrompt({ ...depth, poseReference: { ...depth.poseReference, extra: true } }),
    ).not.toContain('Reference representation=');
  });

  it('keeps walking distinct from standing with exact camera and representation filters', () => {
    const matches = TRYON_MATERIALS.filter((item) =>
      matchesPoseFilters(item, { posture: 'walking', view: 'back' }),
    );
    expect(matches.map((item) => item.id)).toEqual([
      'walking-study-back-lineart',
      'walking-study-back-depth',
    ]);
    expect(getPoseMetadataLabel('posture', 'walking', 'zh-TW')).toBe('走姿');
    expect(getPoseSearchText(matches[0])).toContain('Walking');
    expect(getMaterialPrompt(matches[1])).toContain('posture=walking; view=back');
    expect(matchesPoseFilters(matches[0], { posture: 'standing' })).toBe(false);
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
    ).toEqual([seated.id, 'seated-study-profile-lineart', 'seated-study-profile-depth']);
    expect(
      TRYON_MATERIALS.filter((item) =>
        matchesPoseFilters(item, { posture: 'seated', view: 'front' }),
      ).map((item) => item.id),
    ).toEqual(['seated-study-front-lineart', 'seated-study-front-depth']);
    expect(matchesPoseFilters(TRYON_MATERIALS[0], { posture: 'standing' })).toBe(false);
    expect(TRYON_MATERIALS.map((item) => item.id)).toEqual(ids);
    expect(matchesPoseFilters(seated, { groupId: 'seated', cameraHeight: 'unspecified' })).toBe(
      true,
    );
  });
});
