/**
 * @license
 * Copyright (c) 2026 PoseWear contributors
 * SPDX-License-Identifier: MIT
 * Adapted from batch ZIP/copy actions in src/extras.js at
 * f9f55db356464af87f97b39f5bb57930ed0cd6df.
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/extras.js
 * Full notice: public/licenses/posewear-MIT.txt.
 * Uses trusted local catalog IDs, original image formats and existing JSZip.
 */
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { getMaterialPrompt } from '../constants/poseMetadata.mjs';
import { SITE_URL } from '../constants/site';
import { publicAssetUrl } from './publicAsset';
import { formatReferenceBrief } from './posewearReferences';

function selectedMaterials(ids: readonly string[]) {
  const materials = [...new Set(ids)].map((id) => TRYON_MATERIALS.find((item) => item.id === id));
  if (!materials.length || materials.some((item) => !item))
    throw new Error('Invalid material selection');
  return materials.map((item) => item!);
}
export function materialBatchBrief(ids: readonly string[], language: 'en' | 'zh-TW') {
  const materials = selectedMaterials(ids);
  return formatReferenceBrief(
    materials.map((item) => getMaterialPrompt(item, language)).join('\n'),
    materials.map((item) => ({
      label: language === 'en' ? item.title : item.titleZh,
      url: new URL(item.image, SITE_URL).href,
    })),
    language,
  );
}
export async function buildMaterialBatchZip(ids: readonly string[]): Promise<Blob> {
  const materials = selectedMaterials(ids);
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const extensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/gif': 'gif',
  };
  for (const item of materials) {
    const response = await fetch(publicAssetUrl(item.image));
    if (!response.ok) throw new Error(`Could not load ${item.id}`);
    const blob = await response.blob();
    const ext = extensions[blob.type.split(';')[0]];
    if (!ext || !blob.size) throw new Error(`Invalid image for ${item.id}`);
    zip.file(`${item.id}.${ext}`, await blob.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob' });
}
export async function downloadMaterialBatchZip(ids: readonly string[]): Promise<void> {
  const blob = await buildMaterialBatchZip([...ids]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bloomrender-materials.zip';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
