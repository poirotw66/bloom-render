/*!
 * @license SPDX-License-Identifier: MIT
 * Copyright (c) 2026 PoseWear contributors
 * Adapted from similar-reference ranking in PoseWear src/extras.js:
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/extras.js
 * Changes: deterministic structured pose metadata replaces description parsing
 * and random tie-breaking; only BloomRender's own catalog is used.
 * Full MIT notice: public/licenses/posewear-MIT.txt.
 */
import type { TryOnMaterial } from '../constants/tryOnMaterials';

export function similarMaterials(
  material: TryOnMaterial,
  catalog: readonly TryOnMaterial[],
): TryOnMaterial[] {
  const score = (candidate: TryOnMaterial) => {
    if (material.clothing && candidate.clothing)
      return material.clothing.category === candidate.clothing.category ? 1 : 0;
    if (!material.pose || !candidate.pose) return 0;
    let value = 0;
    if (material.pose.groupId === candidate.pose.groupId) value += 64;
    if (material.pose.view === candidate.pose.view) value += 16;
    if (material.pose.posture === candidate.pose.posture) value += 8;
    if (material.pose.cameraHeight === candidate.pose.cameraHeight) value += 4;
    if (material.pose.framing === candidate.pose.framing) value += 2;
    if (
      material.poseReference &&
      material.poseReference.representation === candidate.poseReference?.representation
    )
      value += 1;
    return value;
  };
  return catalog
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.id !== material.id && candidate.role === material.role)
    .sort((a, b) => score(b.candidate) - score(a.candidate) || a.index - b.index)
    .slice(0, 4)
    .map(({ candidate }) => candidate);
}
