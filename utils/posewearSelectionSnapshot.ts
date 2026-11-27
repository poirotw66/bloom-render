/**
 * @license
 * Copyright (c) 2026 PoseWear contributors
 * SPDX-License-Identifier: MIT
 * Adapted from the clear/undo selection snapshot in PoseWear src/studio.js:
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/studio.js
 * Changes: typed immutable reference collections, revision guard and local File
 * ownership replace DOM/global selection and URL state. No images are included.
 * Full notice: public/licenses/posewear-MIT.txt.
 */
export interface ReferenceSelection<T, Role extends string> {
  clothing: T[];
  references: Partial<Record<Role, T>>;
}
export interface SelectionSnapshot<T, Role extends string> {
  revision: number;
  selection: ReferenceSelection<T, Role>;
}
export function captureSelection<T, Role extends string>(
  selection: ReferenceSelection<T, Role>,
  revision: number,
): SelectionSnapshot<T, Role> {
  return {
    revision,
    selection: {
      clothing: [...selection.clothing],
      references: { ...selection.references },
    },
  };
}
export function restoreSelection<T, Role extends string>(
  snapshot: SelectionSnapshot<T, Role> | null,
  revision: number,
): ReferenceSelection<T, Role> | null {
  if (!snapshot || snapshot.revision !== revision) return null;
  return {
    clothing: [...snapshot.selection.clothing],
    references: { ...snapshot.selection.references },
  };
}
