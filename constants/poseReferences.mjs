import { parsePoseMetadata, POSE_METADATA_FIELDS } from './poseMetadata.mjs';

export const POSE_REPRESENTATIONS = Object.freeze(['lineart', 'depth']);

/**
 * @typedef {{pairId:string, representation:'lineart'|'depth'}} PoseReference
 */

/** @param {unknown} value @returns {PoseReference|null} */
export function parsePoseReference(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = /** @type {Record<string, unknown>} */ (value);
  if (
    Object.keys(data).length !== 2 ||
    typeof data.pairId !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.pairId) ||
    data.pairId.length > 64 ||
    !POSE_REPRESENTATIONS.includes(data.representation)
  )
    return null;
  return /** @type {PoseReference} */ ({
    pairId: data.pairId,
    representation: data.representation,
  });
}

/** @param {string} representation @param {string} [language] */
export function getPoseRepresentationLabel(representation, language = 'en') {
  const labels = { lineart: ['Line art', '線稿'], depth: ['Depth map', '深度圖'] };
  return labels[representation]?.[language === 'zh-TW' ? 1 : 0] ?? representation;
}

/**
 * @typedef {{id:string,role:string,image:string,pose?:import('./poseMetadata.mjs').PoseMetadata,poseReference?:PoseReference}} PoseMaterial
 */

/** @template {PoseMaterial} T @param {T} material @param {readonly T[]} catalog @returns {T|null} */
export function getPairedPoseReference(material, catalog) {
  const reference = parsePoseReference(material.poseReference);
  if (!reference) return null;
  return (
    catalog.find(
      (item) =>
        item.id !== material.id &&
        item.role === 'pose' &&
        item.poseReference?.pairId === reference.pairId &&
        item.poseReference.representation !== reference.representation,
    ) ?? null
  );
}

/** @template {PoseMaterial} T @param {T} material @param {readonly T[]} catalog @returns {T[]} */
export function getPoseAlternatives(material, catalog) {
  const pose = parsePoseMetadata(material.pose);
  if (material.role !== 'pose' || !pose) return [];
  const group = catalog.filter(
    (item) =>
      item.role === 'pose' &&
      item.pose?.groupId === pose.groupId &&
      item.pose.posture === pose.posture &&
      item.pose.cameraHeight === pose.cameraHeight &&
      item.pose.framing === pose.framing,
  );
  return POSE_METADATA_FIELDS.view.flatMap((view) => {
    const candidates = group.filter((item) => item.pose?.view === view);
    const selected =
      candidates.find(
        (item) => item.poseReference?.representation === material.poseReference?.representation,
      ) ??
      candidates.find((item) => item.poseReference?.representation === 'lineart') ??
      candidates[0];
    return selected ? [selected] : [];
  });
}

/** @template {PoseMaterial} T @param {T} material @param {readonly T[]} catalog @param {{view?:string,representation?:string}} [selection] @returns {T|undefined} */
export function getPoseVariant(material, catalog, selection = {}) {
  if (material.role !== 'pose' || !material.pose) return undefined;
  const view = selection.view ?? material.pose.view;
  const representation = selection.representation ?? material.poseReference?.representation;
  return catalog.find(
    (item) =>
      item.role === 'pose' &&
      item.pose?.groupId === material.pose.groupId &&
      item.pose.view === view &&
      item.pose.posture === material.pose.posture &&
      item.pose.cameraHeight === material.pose.cameraHeight &&
      item.pose.framing === material.pose.framing &&
      item.poseReference?.representation === representation,
  );
}

/** @param {readonly PoseMaterial[]} catalog */
export function validatePoseReferences(catalog) {
  const errors = [];
  const pairs = new Map();
  for (const material of catalog) {
    if (!material || typeof material !== 'object') {
      errors.push('Material catalog entries must be objects');
      continue;
    }
    if (material.poseReference === undefined) continue;
    const reference = parsePoseReference(material.poseReference);
    const pose = parsePoseMetadata(material.pose);
    if (material.role !== 'pose' || !pose || !reference) {
      errors.push(
        `${material.id}: poseReference requires a valid pose material and pairId/representation`,
      );
      continue;
    }
    const members = pairs.get(reference.pairId) ?? [];
    members.push(material);
    pairs.set(reference.pairId, members);
  }
  for (const [pairId, members] of pairs) {
    if (
      members.length !== 2 ||
      new Set(members.map((item) => item.poseReference.representation)).size !== 2
    ) {
      errors.push(`${pairId}: a pair requires exactly one lineart and one depth material`);
      continue;
    }
    const [first, second] = members;
    if (
      ['groupId', ...Object.keys(POSE_METADATA_FIELDS)].some(
        (field) => first.pose[field] !== second.pose[field],
      )
    )
      errors.push(`${pairId}: paired materials must have identical pose and camera metadata`);
    if (first.image === second.image)
      errors.push(`${pairId}: paired representations must use distinct images`);
  }
  return errors;
}
