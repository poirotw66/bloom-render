/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Content-Security-Policy applied via <meta http-equiv> in index.html and
 * every emit-route-html per-route shell. Keep in sync with network hosts the
 * app actually calls (Gemini, OpenAI, OpenRouter, Hugging Face model hub, jsDelivr
 * ONNX/transformers WASM).
 *
 * Plain .mjs so Node 20 CI can import it from scripts/emit-route-html.mjs
 * without TypeScript strip-types.
 */

import { CONNECT_ORIGINS, IMAGE_ORIGINS } from './networkSources.mjs';

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  ['img-src', "'self'", 'data:', 'blob:', ...IMAGE_ORIGINS].join(' '),
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ['connect-src', "'self'", ...CONNECT_ORIGINS, 'blob:', 'data:'].join(' '),
].join('; ');
