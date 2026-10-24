/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { VIRAL_TEMPLATES, getViralTemplateById } from '../../constants/viralTemplates';
import { demoViralThumbnailPath, resolveDemoResultAssetPath } from './demoViralResult';

describe('demoViralResult', () => {
  it('maps each viral template id to its dedicated thumbnail path', () => {
    for (const template of VIRAL_TEMPLATES) {
      expect(demoViralThumbnailPath(template.id)).toBe(`/examples/viral/${template.id}.webp`);
      expect(template.thumbnail).toBe(`examples/viral/${template.id}.webp`);
    }
  });

  it('resolves collage slot demo sources to that slot’s thumbnail', () => {
    const collageIds = ['figurine-box', 'polaroid-frame', 'taiwan-101', 'yearbook-90s'];
    for (const id of collageIds) {
      const tmpl = getViralTemplateById(id);
      expect(tmpl, id).toBeTruthy();
      expect(resolveDemoResultAssetPath({ context: 'viral-style', viralTemplateId: id })).toBe(
        `/${tmpl!.thumbnail}`,
      );
    }
  });

  it('resolves multi-person demo results to the selected scene thumbnail', () => {
    for (const id of ['graduation-group', 'camping-friends', 'christmas-party']) {
      const tmpl = getViralTemplateById(id);
      expect(tmpl?.supportsMultiPerson, id).toBe(true);
      expect(resolveDemoResultAssetPath({ context: 'multi-person', viralTemplateId: id })).toBe(
        `/examples/viral/${id}.webp`,
      );
    }
  });

  it('does not fall back to generic assets for viral-style without a template id', () => {
    expect(resolveDemoResultAssetPath({ context: 'viral-style' })).toBeNull();
    expect(resolveDemoResultAssetPath({ context: 'multi-person' })).toBeNull();
  });
});
