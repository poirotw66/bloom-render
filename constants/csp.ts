/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Content-Security-Policy applied via <meta http-equiv> in index.html and
 * every emit-route-html per-route shell. Keep in sync with network hosts the
 * app actually calls (Gemini, OpenRouter, Hugging Face model hub, jsDelivr
 * ONNX/transformers WASM).
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://www.bloss0m.com",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  [
    'connect-src',
    "'self'",
    'https://generativelanguage.googleapis.com',
    'https://openrouter.ai',
    'https://huggingface.co',
    'https://cdn-lfs.huggingface.co',
    'https://cdn-lfs-us-1.huggingface.co',
    'https://hf.co',
    'https://cdn.jsdelivr.net',
    'blob:',
    'data:',
  ].join(' '),
].join('; ');
