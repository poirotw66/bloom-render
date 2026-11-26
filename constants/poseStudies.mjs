/** Explicit original study sources. Catalog data cannot authorize new manifests. */
const source = 'https://github.com/poirotw66/bloom-render/tree/main/public/images/tryon-materials';
export const POSE_STUDIES = Object.freeze(
  [
    { id: 'standing-study', posture: 'standing' },
    { id: 'hand-on-hip-study', posture: 'standing' },
    { id: 'seated-study', posture: 'seated' },
  ].map((study) =>
    Object.freeze({
      ...study,
      manifest: `images/tryon-materials/${study.id}-manifest.json`,
      generator: 'scripts/generate-pose-study.py',
      license: 'CC0-1.0',
      source,
    }),
  ),
);
