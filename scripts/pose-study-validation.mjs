import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { validatePoseReferences } from '../constants/poseReferences.mjs';

const MANIFEST = 'images/tryon-materials/standing-study-manifest.json';
const YAW_BY_VIEW = { front: 0, 'three-quarter': 45, profile: 90, back: 180 };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const isHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

/** Check provenance against the actual images that will be served. */
export function validatePoseStudy(root, assetDir = path.join(root, 'public')) {
  const errors = [];
  const fail = (message) => errors.push(`pose study: ${message}`);
  let materials;
  try {
    materials = JSON.parse(readFileSync(path.join(root, 'constants/tryOnMaterials.json'), 'utf8'));
  } catch (error) {
    return [`pose study: cannot read material catalog (${error.message})`];
  }
  if (!Array.isArray(materials)) return ['pose study: material catalog must be an array'];
  errors.push(...validatePoseReferences(materials));
  const paired = materials.filter(
    (material) => material && typeof material === 'object' && material.poseReference !== undefined,
  );
  if (!paired.length) return errors;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path.join(assetDir, MANIFEST), 'utf8'));
  } catch (error) {
    return [...errors, `pose study: missing or invalid ${MANIFEST} (${error.message})`];
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    return [...errors, 'pose study: manifest must be an object'];
  if (manifest.v !== 1 || manifest.id !== 'standing-study' || manifest.license !== 'CC0-1.0')
    fail('manifest version, identity and CC0 license must match the declared study');
  if (manifest.generator !== 'scripts/generate-pose-study.py') fail('unexpected generator path');
  if (!isHash(manifest.geometrySha256)) fail('geometry SHA-256 is required');
  try {
    if (
      !isHash(manifest.generatorSha256) ||
      hash(readFileSync(path.join(root, 'scripts/generate-pose-study.py'))) !==
        manifest.generatorSha256
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
    return [...errors, 'pose study: manifest must provide four paired camera views'];
  const pairIds = new Set();
  const views = new Set();
  for (const pair of manifest.pairs) {
    const label = pair?.pairId ?? '(missing pair ID)';
    if (
      typeof label !== 'string' ||
      !/^standing-study-(front|three-quarter|profile|back)$/.test(label) ||
      label !== `standing-study-${pair?.view}`
    ) {
      fail(`${label}: invalid pair identity`);
      continue;
    }
    if (pairIds.has(label)) fail(`${label}: duplicate pair ID`);
    pairIds.add(label);
    if (!Object.hasOwn(YAW_BY_VIEW, pair?.view) || views.has(pair.view))
      fail(`${label}: invalid or duplicate view`);
    views.add(pair?.view);
    const camera = pair?.camera;
    if (
      !camera ||
      camera.projection !== 'orthographic' ||
      camera.yawDegrees !== YAW_BY_VIEW[pair.view] ||
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
    ) {
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
      const matching = paired.filter(
        (material) =>
          material.poseReference?.pairId === pair.pairId &&
          material.poseReference.representation === representation,
      );
      const material = matching[0];
      if (
        matching.length !== 1 ||
        material.id !== `${label}-${representation}` ||
        material.image !== asset.image ||
        material.pose?.groupId !== manifest.id ||
        material.pose?.view !== pair.view ||
        material.pose?.posture !== 'standing' ||
        material.pose?.cameraHeight !== 'eye-level' ||
        material.pose?.framing !== 'full-body' ||
        material.license !== manifest.license ||
        material.source !== manifest.source
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
  for (const material of paired)
    if (!pairIds.has(material.poseReference?.pairId))
      fail(`${material.id}: no provenance manifest declares this pair`);
  return errors;
}
