/*!
 * @license SPDX-License-Identifier: MIT
 * Copyright (c) 2026 PoseWear contributors
 * Adapted from selection and stepLb in PoseWear src/history.js:
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/history.js
 * Changes: immutable ID selection and bounded navigation instead of DOM globals.
 * Full MIT notice: public/licenses/posewear-MIT.txt.
 */
export function visibleHistorySelection(selected: readonly string[], visible: readonly string[]) {
  const selectedIds = new Set(selected);
  return visible.filter((id) => selectedIds.has(id));
}

export function adjacentHistoryId(ids: readonly string[], currentId: string, delta: -1 | 1) {
  const index = ids.indexOf(currentId);
  return index < 0 ? undefined : ids[index + delta];
}
