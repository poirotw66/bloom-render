/**
 * @license
 * Copyright (c) 2026 PoseWear contributors
 * SPDX-License-Identifier: MIT
 *
 * Adapted from formatBrief in PoseWear src/references.js at
 * f9f55db356464af87f97b39f5bb57930ed0cd6df:
 * https://github.com/atuizz/posewear/blob/f9f55db356464af87f97b39f5bb57930ed0cd6df/src/references.js
 * Changes: typed module exports and Traditional Chinese copy. Catalog lookup,
 * image URL construction and upstream library metadata are not included.
 * Full notice: public/licenses/posewear-MIT.txt.
 */

export interface PublicBriefReference {
  label: string;
  url: string;
}

export function formatReferenceBrief(
  prompt: string,
  references: readonly (PublicBriefReference | null)[],
  language: 'en' | 'zh-TW' = 'zh-TW',
): string {
  const en = language === 'en';
  const lines: string[] = [];
  if (references.length) {
    lines.push(en ? 'Reference images' : '參考圖');
    references.forEach((ref, index) => {
      const slot = (en ? 'Image ' : '圖 ') + (index + 1);
      const value = ref
        ? ref.label + ' — ' + ref.url
        : en
          ? 'Attach this local image separately.'
          : '請另附這張本機參考圖。';
      lines.push('- ' + slot + ' · ' + value);
    });
  }
  return [prompt, lines.join('\n')].filter(Boolean).join('\n\n');
}
