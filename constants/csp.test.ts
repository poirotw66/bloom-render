/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY } from './csp';

describe('CONTENT_SECURITY_POLICY', () => {
  it('uses wasm-unsafe-eval and omits unsafe-eval', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("'wasm-unsafe-eval'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("'unsafe-eval'");
  });

  it('limits connect-src to known AI / model hosts', () => {
    expect(CONTENT_SECURITY_POLICY).toContain('https://generativelanguage.googleapis.com');
    expect(CONTENT_SECURITY_POLICY).toContain('https://openrouter.ai');
    expect(CONTENT_SECURITY_POLICY).toContain('https://huggingface.co');
    expect(CONTENT_SECURITY_POLICY).toContain('https://cdn.jsdelivr.net');
    expect(CONTENT_SECURITY_POLICY).toContain('blob:');
    expect(CONTENT_SECURITY_POLICY).toContain('data:');
  });

  it('is embedded in index.html meta CSP', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain(`content="${CONTENT_SECURITY_POLICY}"`);
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
    expect(html).toContain('name="theme-color" content="#1a1216"');
  });
});
