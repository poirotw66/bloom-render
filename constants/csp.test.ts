/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY } from './csp';
import {
  CONNECT_ORIGINS,
  NETWORK_ONLY_PATTERN,
  NETWORK_SOURCES,
  PROVIDER_ENDPOINTS,
  validateNetworkSources,
} from './networkSources.mjs';

describe('CONTENT_SECURITY_POLICY', () => {
  it('uses wasm-unsafe-eval and omits unsafe-eval', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("'wasm-unsafe-eval'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("'unsafe-eval'");
  });

  it('limits connect-src to known AI / model hosts', () => {
    expect(CONTENT_SECURITY_POLICY).toContain('https://generativelanguage.googleapis.com');
    expect(CONTENT_SECURITY_POLICY).toContain('https://openrouter.ai');
    expect(CONTENT_SECURITY_POLICY).toContain('https://api.openai.com');
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

describe('trusted network sources', () => {
  it('accepts the registry and covers every provider endpoint without granting image access', () => {
    expect(validateNetworkSources()).toEqual([]);
    for (const endpoint of Object.values(PROVIDER_ENDPOINTS)) {
      expect(CONNECT_ORIGINS).toContain(new URL(endpoint).origin);
      expect(NETWORK_ONLY_PATTERN.test(endpoint)).toBe(true);
    }
    expect(NETWORK_SOURCES.find((source) => source.id === 'openai')?.directives).toEqual([
      'connect-src',
    ]);
    expect(
      CONTENT_SECURITY_POLICY.split('; ').find((directive) => directive.startsWith('img-src')),
    ).not.toContain('https://github.com');
  });

  it.each([
    'http://api.openai.com',
    'https://api.openai.com/',
    'https://api.openai.com/v1',
    'https://user:secret@api.openai.com',
    'https://*.openai.com',
    'https:',
  ])('rejects a non-origin permission %s', (origin) => {
    expect(
      validateNetworkSources([
        { id: 'invalid', origin, directives: ['connect-src'], networkOnly: true },
      ]),
    ).not.toEqual([]);
  });

  it('rejects duplicate declarations and unrelated directives', () => {
    expect(validateNetworkSources([NETWORK_SOURCES[0], NETWORK_SOURCES[0]])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duplicate id'),
        expect.stringContaining('duplicate origin'),
      ]),
    );
    expect(
      validateNetworkSources([
        {
          id: 'script',
          origin: 'https://example.com',
          directives: ['script-src'],
          networkOnly: false,
        },
      ]),
    ).toEqual(expect.arrayContaining([expect.stringContaining('directives')]));
    expect(
      validateNetworkSources([
        { id: 'image', origin: 'https://example.com', directives: ['img-src'], networkOnly: true },
      ]),
    ).toEqual(expect.arrayContaining([expect.stringContaining('NetworkOnly')]));
  });

  it('keeps every allowed model origin uncached without matching lookalike hosts', () => {
    for (const origin of CONNECT_ORIGINS) {
      expect(NETWORK_ONLY_PATTERN.test(`${origin}/model?download=true`)).toBe(true);
      expect(NETWORK_ONLY_PATTERN.test(`${origin}.evil.example/model`)).toBe(false);
      expect(NETWORK_ONLY_PATTERN.test(`${origin}:444/model`)).toBe(false);
    }
    expect(NETWORK_ONLY_PATTERN.test('https://www.bloss0m.com/image.webp')).toBe(false);
    expect(NETWORK_ONLY_PATTERN.test('https://example.com/openrouter.ai')).toBe(false);
  });
});
