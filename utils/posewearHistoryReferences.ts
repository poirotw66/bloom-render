/*!
 * @license SPDX-License-Identifier: MIT
 * Copyright (c) 2026 PoseWear contributors
 * Adapted from drawLbRefs in PoseWear src/history.js:
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/history.js
 * Full MIT notice: public/licenses/posewear-MIT.txt
 * Ordered input references prefer stored blobs over trusted catalog previews.
 */
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import type { HistoryItem } from './historyDb';
import { parseTryOnRecipe, type TryOnReferenceRole } from '../types/tryOnRecipe';

export interface HistoryReferenceTrace {
  slot: number;
  role: 'person' | TryOnReferenceRole | 'reference';
  name: string;
  blob?: Blob;
  materialId?: string;
  catalogImage?: string;
  source: 'stored' | 'catalog' | 'missing';
}
const roles = new Set(['clothing', 'pose', 'expression', 'scene', 'lighting']);
function isImageBlob(value: unknown): value is Blob {
  return value instanceof Blob && value.size > 0 && value.type.startsWith('image/');
}

/** Keep generation input order, without interpreting record metadata as URLs. */
export function buildHistoryReferenceTrace(
  item: Pick<HistoryItem, 'sourceBlob' | 'references' | 'options'>,
): HistoryReferenceTrace[] {
  const refs: HistoryReferenceTrace[] = [];
  if (isImageBlob(item.sourceBlob)) {
    refs.push({ slot: 1, role: 'person', name: '', blob: item.sourceBlob, source: 'stored' });
  }
  const storedReferences = Array.isArray(item.references) ? item.references : [];
  // Old records may retain only a recipe. Resolve known IDs locally, while
  // marking these as current catalog previews rather than saved snapshots.
  const recipe = storedReferences.length === 0 ? parseTryOnRecipe(item.options?.recipe) : null;
  const candidates = recipe
    ? recipe.materialIds.flatMap((id) => {
        const material = TRYON_MATERIALS.find((entry) => entry.id === id);
        return material ? [{ role: material.role, name: '', materialId: id, blob: undefined }] : [];
      })
    : storedReferences;
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const role = roles.has(candidate.role) ? candidate.role : 'reference';
    const material =
      typeof candidate.materialId === 'string'
        ? TRYON_MATERIALS.find((entry) => entry.id === candidate.materialId && entry.role === role)
        : undefined;
    const blob = isImageBlob(candidate.blob) ? candidate.blob : undefined;
    refs.push({
      slot: refs.length + 1,
      role,
      name: typeof candidate.name === 'string' ? candidate.name : '',
      ...(blob ? { blob } : {}),
      ...(material ? { materialId: material.id, catalogImage: material.image } : {}),
      source: blob ? 'stored' : material ? 'catalog' : 'missing',
    });
  }
  return refs;
}
