import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { POSE_STUDIES } from '../constants/poseStudies.mjs';
import { validatePoseReferences } from '../constants/poseReferences.mjs';

const YAW_BY_VIEW = { front: 0, 'three-quarter': 45, profile: 90, back: 180 };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const isHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function validCamera(camera, view, depth) {
  if (
    !camera ||
    camera.projection !== 'orthographic' ||
    camera.yawDegrees !== YAW_BY_VIEW[view] ||
    camera.pitchDegrees !== 0 ||
    !Array.isArray(camera.position) ||
    camera.position.length !== 3 ||
    camera.position.some((value) => !Number.isFinite(value)) ||
    !Number.isFinite(camera.targetHeight) ||
    !Number.isFinite(camera.verticalFrameOffset) ||
    Math.abs(camera.position[1] + camera.verticalFrameOffset - camera.targetHeight) > 0.00001 ||
    !Number.isFinite(camera.frameWidth) ||
    camera.frameWidth <= 0 ||
    !Number.isFinite(camera.frameHeight) ||
    camera.frameHeight <= 0 ||
    !Number.isInteger(camera.width) ||
    camera.width <= 0 ||
    !Number.isInteger(camera.height) ||
    camera.height <= 0 ||
    camera.near !== depth?.near ||
    camera.far !== depth?.far
  )
    return false;
  const distance = Math.hypot(camera.position[0], camera.position[2]);
  const yaw = (camera.yawDegrees * Math.PI) / 180;
  return (
    distance > 0 &&
    Math.abs(camera.position[0] - distance * Math.sin(yaw)) < 0.00001 &&
    Math.abs(camera.position[2] - distance * Math.cos(yaw)) < 0.00001
  );
}

function validateStudy(root, assetDir, study, materials) {
  const errors = [];
  const fail = (message) => errors.push(`pose study ${study.id}: ${message}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path.join(assetDir, study.manifest), 'utf8'));
  } catch (error) {
    return [`pose study ${study.id}: missing or invalid ${study.manifest} (${error.message})`];
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    return [`pose study ${study.id}: manifest must be an object`];
  if (
    manifest.v !== 1 ||
    manifest.id !== study.id ||
    manifest.posture !== study.posture ||
    manifest.license !== study.license ||
    manifest.source !== study.source
  )
    fail('manifest version, identity, posture and CC0 provenance must match the registered study');
  if (manifest.generator !== study.generator) fail('unexpected generator path');
  if (!isHash(manifest.geometrySha256)) fail('geometry SHA-256 is required');
  try {
    if (
      !isHash(manifest.generatorSha256) ||
      hash(readFileSync(path.join(root, study.generator))) !== manifest.generatorSha256
    )
      fail('generator hash differs from manifest; regenerate the study');
  } catch (error) {
    fail(`cannot read generator (${error.message})`);
  }
  const depth = manifest.depth;
  if (
    !depth ||
    depth.kind !== 'synthetic-orthographic-camera-depth' ||
    !Number.isFinite(depth.near) ||
    depth.near <= 0 ||
    !Number.isFinite(depth.far) ||
    depth.far <= depth.near ||
    depth.nearValue !== 255 ||
    depth.farValue !== 1 ||
    depth.backgroundValue !== 0 ||
    typeof depth.units !== 'string' ||
    !depth.units.includes('not metric')
  )
    fail(
      'depth must declare normalized synthetic camera depth, white-near, dark-far and a separate background',
    );
  if (!Array.isArray(manifest.pairs) || manifest.pairs.length !== 4)
    return [...errors, `pose study ${study.id}: manifest must provide four paired camera views`];
  const pairIds = new Set();
  const views = new Set();
  for (const pair of manifest.pairs) {
    const label = pair?.pairId ?? '(missing pair ID)';
    if (
      typeof label !== 'string' ||
      !Object.hasOwn(YAW_BY_VIEW, pair?.view) ||
      label !== `${study.id}-${pair.view}`
    ) {
      fail(`${label}: invalid pair identity`);
      continue;
    }
    if (pairIds.has(label)) fail(`${label}: duplicate pair ID`);
    pairIds.add(label);
    if (views.has(pair.view)) fail(`${label}: invalid or duplicate view`);
    views.add(pair.view);
    const camera = pair.camera;
    if (!validCamera(camera, pair.view, depth)) {
      fail(`${label}: invalid or inconsistent orthographic camera`);
      continue;
    }
    for (const representation of ['lineart', 'depth']) {
      const asset = pair[representation];
      const expectedImage = `images/tryon-materials/${label}-${representation}.png`;
      if (!asset || asset.image !== expectedImage || !isHash(asset.sha256)) {
        fail(`${label}: ${representation} needs a local PNG path and SHA-256`);
        continue;
      }
      const matching = materials.filter(
        (material) =>
          material.poseReference?.pairId === label &&
          material.poseReference?.representation === representation,
      );
      const material = matching[0];
      if (
        matching.length !== 1 ||
        material.id !== `${label}-${representation}` ||
        material.image !== asset.image ||
        material.pose?.groupId !== study.id ||
        material.pose?.view !== pair.view ||
        material.pose?.posture !== study.posture ||
        material.pose?.cameraHeight !== 'eye-level' ||
        material.pose?.framing !== 'full-body' ||
        material.license !== study.license ||
        material.source !== study.source
      )
        fail(
          `${label}: ${representation} catalog identity, view or provenance differs from manifest`,
        );
      try {
        const file = readFileSync(path.join(assetDir, expectedImage));
        if (hash(file) !== asset.sha256)
          fail(`${label}: ${representation} image hash differs from manifest`);
        if (
          file.length < 24 ||
          file.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
          file.readUInt32BE(16) !== camera.width ||
          file.readUInt32BE(20) !== camera.height
        )
          fail(`${label}: ${representation} PNG dimensions differ from its paired camera`);
      } catch (error) {
        fail(`${label}: cannot read ${representation} image (${error.message})`);
      }
    }
  }
  for (const material of materials)
    if (!pairIds.has(material.poseReference?.pairId))
      fail(`${material.id}: no provenance manifest declares this pair`);
  return errors;
}

/** Validate only explicitly registered original studies against served image bytes. */
export function validatePoseStudy(root, assetDir = path.join(root, 'public')) {
  let materials;
  try {
    materials = JSON.parse(readFileSync(path.join(root, 'constants/tryOnMaterials.json'), 'utf8'));
  } catch (error) {
    return [`pose study: cannot read material catalog (${error.message})`];
  }
  if (!Array.isArray(materials)) return ['pose study: material catalog must be an array'];
  const errors = validatePoseReferences(materials);
  const paired = materials.filter(
    (material) => material && typeof material === 'object' && material.poseReference !== undefined,
  );
  if (!paired.length) return errors;
  const registered = new Set(POSE_STUDIES.map((study) => study.id));
  for (const material of paired)
    if (!registered.has(material.pose?.groupId))
      errors.push(`${material.id}: paired pose group is not a registered original study`);
  for (const study of POSE_STUDIES) {
    const group = paired.filter((material) => material.pose?.groupId === study.id);
    if (!group.length) {
      errors.push(`pose study ${study.id}: registered study has no catalog pairs`);
      continue;
    }
    errors.push(...validateStudy(root, assetDir, study, group));
  }
  return errors;
}
