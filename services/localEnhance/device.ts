/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Prefer WebGPU when an adapter is available; otherwise WASM (onnxruntime-web).
 */

export type LocalEnhanceDevice = 'webgpu' | 'wasm';

export async function resolveEnhanceDevice(
  gpu: { requestAdapter?: () => Promise<unknown> } | undefined = (
    globalThis as { navigator?: { gpu?: { requestAdapter?: () => Promise<unknown> } } }
  ).navigator?.gpu,
): Promise<LocalEnhanceDevice> {
  if (!gpu || typeof gpu.requestAdapter !== 'function') {
    return 'wasm';
  }
  try {
    const adapter = await gpu.requestAdapter();
    return adapter ? 'webgpu' : 'wasm';
  } catch {
    return 'wasm';
  }
}
