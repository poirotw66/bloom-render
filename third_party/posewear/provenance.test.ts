import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Provenance {
  commit: string;
  copyright: string;
  licenseSha256: string;
  distributedNotice: string;
  modules: { localPath: string; sourceUrl: string }[];
}

const root = new URL('../../', import.meta.url);
const manifest: Provenance = JSON.parse(
  readFileSync(new URL('third_party/posewear/manifest.json', root), 'utf8'),
);

describe('PoseWear MIT code provenance', () => {
  it('retains the complete upstream permission notice unchanged', () => {
    const notice = readFileSync(new URL(manifest.distributedNotice, root));
    expect(createHash('sha256').update(notice).digest('hex')).toBe(manifest.licenseSha256);
    expect(notice.toString()).toContain(manifest.copyright);
    expect(notice.toString()).toContain('Permission is hereby granted, free of charge');
  });

  it('keeps upstream copyright and pinned source attribution in each adapted module', () => {
    for (const entry of manifest.modules) {
      const source = readFileSync(new URL(entry.localPath, root), 'utf8');
      expect(source).toMatch(/\/\*!|@license/);
      expect(source).toContain(manifest.copyright);
      expect(source).toContain('SPDX-License-Identifier: MIT');
      expect(source).toContain(entry.sourceUrl);
      expect(entry.sourceUrl).toContain(`/blob/${manifest.commit}/src/`);
      expect(source).toContain('public/licenses/posewear-MIT.txt');
    }
  });
});
