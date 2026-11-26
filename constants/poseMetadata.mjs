import { getPoseRepresentationLabel, parsePoseReference } from './poseReferences.mjs';

/** Shared pose vocabulary for browser prompts, catalog filters and the local MCP. */
export const POSE_METADATA_FIELDS = Object.freeze({
  posture: Object.freeze(['standing', 'seated']),
  view: Object.freeze(['front', 'three-quarter', 'profile', 'back']),
  cameraHeight: Object.freeze(['eye-level', 'high-angle', 'low-angle', 'unspecified']),
  framing: Object.freeze(['full-body', 'upper-body', 'close-up']),
});

/**
 * @typedef {object} PoseMetadata
 * @property {string} groupId
 * @property {'standing'|'seated'} posture
 * @property {'front'|'three-quarter'|'profile'|'back'} view
 * @property {'eye-level'|'high-angle'|'low-angle'|'unspecified'} cameraHeight
 * @property {'full-body'|'upper-body'|'close-up'} framing
 */

const LABELS = {
  groupId: {
    'relaxed-standing': ['Relaxed standing', '自然站姿'],
    'hand-on-hip': ['Hand on hip', '單手叉腰'],
    seated: ['Seated', '坐姿'],
    'standing-study': ['Standing study', '站姿研究'],
    'hand-on-hip-study': ['Hand-on-hip study', '叉腰姿勢研究'],
    'seated-study': ['Seated study', '坐姿研究'],
  },
  posture: { standing: ['Standing', '站姿'], seated: ['Seated', '坐姿'] },
  view: {
    front: ['Front', '正面'],
    'three-quarter': ['Three-quarter', '四分之三側面'],
    profile: ['Profile', '側面'],
    back: ['Back', '背面'],
  },
  cameraHeight: {
    'eye-level': ['Eye level', '平視'],
    'high-angle': ['High angle', '俯視'],
    'low-angle': ['Low angle', '仰視'],
    unspecified: ['Not specified', '未標示'],
  },
  framing: {
    'full-body': ['Full body', '全身'],
    'upper-body': ['Upper body', '上半身'],
    'close-up': ['Close-up', '特寫'],
  },
};

/** @param {unknown} value @returns {PoseMetadata|null} */
export function parsePoseMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = /** @type {Record<string, unknown>} */ (value);
  const fields = ['groupId', ...Object.keys(POSE_METADATA_FIELDS)];
  if (
    Object.keys(record).length !== fields.length ||
    !fields.every((field) => Object.hasOwn(record, field))
  )
    return null;
  if (
    typeof record.groupId !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.groupId) ||
    record.groupId.length > 64
  )
    return null;
  for (const [field, choices] of Object.entries(POSE_METADATA_FIELDS)) {
    if (typeof record[field] !== 'string' || !choices.includes(record[field])) return null;
  }
  return /** @type {PoseMetadata} */ ({ ...record });
}

/** @param {{role:string,pose?:unknown}} material */
export function isValidMaterialPose(material) {
  return material.role === 'pose'
    ? parsePoseMetadata(material.pose) !== null
    : material.pose === undefined;
}

/** @param {string} field @param {string} value @param {string} [language] */
export function getPoseMetadataLabel(field, value, language = 'en') {
  return LABELS[field]?.[value]?.[language === 'zh-TW' ? 1 : 0] ?? value;
}

/** @param {{role:string,pose?:unknown,poseReference?:unknown}} material */
export function getPoseSearchText(material) {
  if (material.role !== 'pose') return '';
  const pose = parsePoseMetadata(material.pose);
  if (!pose) return '';
  const reference = parsePoseReference(material.poseReference);
  return [
    ...Object.entries(pose).flatMap(([field, value]) => [
      value,
      getPoseMetadataLabel(field, value, 'en'),
      getPoseMetadataLabel(field, value, 'zh-TW'),
    ]),
    ...(reference
      ? [
          reference.pairId,
          reference.representation,
          getPoseRepresentationLabel(reference.representation, 'en'),
          getPoseRepresentationLabel(reference.representation, 'zh-TW'),
        ]
      : []),
  ].join(' ');
}

/** @param {{role:string,prompt:string,pose?:unknown,poseReference?:unknown}} material @param {string} [language] */
export function getMaterialPrompt(material, language = 'en') {
  const pose = material.role === 'pose' ? parsePoseMetadata(material.pose) : null;
  if (!pose) return material.prompt;
  const instructions = [
    `posture=${pose.posture}`,
    `view=${pose.view}`,
    ...(pose.cameraHeight === 'unspecified' ? [] : [`cameraHeight=${pose.cameraHeight}`]),
    `framing=${pose.framing}`,
  ];
  const heading = language === 'zh-TW' ? '姿勢與機位' : 'Pose and camera';
  const perspective = `${material.prompt}\n${heading}: ${instructions.join('; ')}. Follow the reference perspective and framing; do not invent a different camera angle.`;
  const reference = parsePoseReference(material.poseReference);
  if (!reference) return perspective;
  const representation =
    reference.representation === 'depth'
      ? 'Use this synthetic normalized depth map only for pose, occlusion and near/far structure: lighter foreground surfaces are nearer, darker foreground surfaces are farther, and black is background. It is not measured human depth, skin color, clothing texture or a lighting reference.'
      : 'Use this line-art reference only for pose, silhouette and limb structure; do not transfer its mannequin appearance, line style or clothing.';
  return `${perspective}\nReference representation=${reference.representation}. ${representation} Follow this one camera view; do not create a multi-view sheet or multiple panels.`;
}

/**
 * @param {{role:string,pose?:unknown}} material
 * @param {{groupId?:string,posture?:string,view?:string,cameraHeight?:string,framing?:string}} [filters]
 */
export function matchesPoseFilters(material, filters = {}) {
  const selected = Object.entries(filters).filter(
    ([, value]) => value !== undefined && value !== '',
  );
  if (!selected.length) return true;
  const pose = material.role === 'pose' ? parsePoseMetadata(material.pose) : null;
  return !!pose && selected.every(([field, value]) => pose[field] === value);
}
