/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { entryFromIssueSections, parseIssueFormBody } from './parse-gallery-issue.mjs';

describe('parseIssueFormBody', () => {
  it('extracts labeled sections', () => {
    const body = `### id

misty-fjord-dawn

### title

Misty fjord dawn

### titleZh

薄霧峽灣黎明

### prompt

Wide misty fjord at dawn

### feature

generate

### thumbnail

_No response_
`;
    const sections = parseIssueFormBody(body);
    expect(sections.id).toBe('misty-fjord-dawn');
    expect(sections.thumbnail).toBe('');
    const entry = entryFromIssueSections(sections);
    expect(entry.id).toBe('misty-fjord-dawn');
    expect(entry.titleZh).toBe('薄霧峽灣黎明');
    expect(entry.thumbnail).toBeUndefined();
    expect(entry.feature).toBe('generate');
  });
});
