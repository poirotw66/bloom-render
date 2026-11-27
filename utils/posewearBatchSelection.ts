/**
 * @license
 * Copyright (c) 2026 PoseWear contributors
 * SPDX-License-Identifier: MIT
 * Adapted from selectedKeys, filterBatch and togglePick in src/extras.js:
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/extras.js
 * Changes: immutable typed selection functions for React; no DOM or catalog data.
 * Full notice: public/licenses/posewear-MIT.txt.
 */
export function pruneBatchSelection(
  selected: readonly string[],
  visible: readonly string[],
): string[] {
  const valid = new Set(visible);
  return [...new Set(selected)].filter((id) => valid.has(id));
}

export function toggleBatchSelection(selected: readonly string[], id: string): string[] {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return [...next];
}

export function selectVisibleMaterials(visible: readonly string[]): string[] {
  return [...new Set(visible)];
}
