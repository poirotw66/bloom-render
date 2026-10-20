/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Lazy-load + cache transformers.js pipelines for background removal and 2× upscale.
 * Models download on first use and are cached by the browser (env.useBrowserCache).
 */

import { aggregateFileProgress, normalizeHubProgress, type LocalEnhanceProgress } from './progress';
import { resolveEnhanceDevice, type LocalEnhanceDevice } from './device';
import { modelForTask, type LocalEnhanceTask } from './models';
import { blobToDataUrl, isUsableImageSource, rgbaBufferToPngDataUrl } from './imageIO';
import { logger } from '../../utils/logger';

type ProgressCb = (progress: LocalEnhanceProgress) => void;

type RawImageLike = {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
  channels: number;
  toBlob?: (type?: string, quality?: number) => Promise<Blob>;
};

type PipelineFn = (input: string) => Promise<RawImageLike | RawImageLike[]>;

type PipelineCache = {
  removeBg?: PipelineFn;
  upscale2x?: PipelineFn;
  device?: LocalEnhanceDevice;
};

const cache: PipelineCache = {};

let envConfigured = false;

async function loadTransformers() {
  // Dynamic import keeps onnxruntime / transformers out of the initial bundle.
  return import('@huggingface/transformers');
}

async function ensureEnv(): Promise<void> {
  if (envConfigured) return;
  const { env } = await loadTransformers();
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  // Serve ORT WASM from the package CDN so Vite/GitHub Pages need no copy step.
  const version = '3.8.1';
  if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${version}/dist/`;
  }
  envConfigured = true;
}

function makeProgressHandler(onProgress?: ProgressCb) {
  const fileProgress: Record<string, number> = {};
  return (event: {
    status: string;
    progress?: number;
    loaded?: number;
    total?: number;
    file?: string;
  }) => {
    const normalized = normalizeHubProgress(event);
    if (event.status === 'progress' && event.file) {
      fileProgress[event.file] = normalized.percent;
      onProgress?.({
        percent: aggregateFileProgress(fileProgress),
        statusKey: normalized.statusKey,
        file: event.file,
      });
      return;
    }
    if (event.status === 'done' && event.file) {
      fileProgress[event.file] = 100;
    }
    onProgress?.(normalized);
  };
}

async function getOrCreatePipeline(
  task: LocalEnhanceTask,
  onProgress?: ProgressCb,
): Promise<PipelineFn> {
  await ensureEnv();
  const device = cache.device ?? (await resolveEnhanceDevice());
  cache.device = device;

  if (task === 'remove-bg' && cache.removeBg) return cache.removeBg;
  if (task === 'upscale-2x' && cache.upscale2x) return cache.upscale2x;

  const info = modelForTask(task);
  const { pipeline } = await loadTransformers();
  onProgress?.({ percent: 0, statusKey: 'enhance.status_loading_model' });

  const tryCreate = async (dev: LocalEnhanceDevice): Promise<PipelineFn> => {
    const pipe = await pipeline(info.pipelineTask, info.modelId, {
      device: dev,
      progress_callback: makeProgressHandler(onProgress),
    });
    return async (input: string) => pipe(input) as Promise<RawImageLike | RawImageLike[]>;
  };

  let pipeFn: PipelineFn;
  try {
    pipeFn = await tryCreate(device);
  } catch (err) {
    if (device === 'webgpu') {
      logger.warn('WebGPU enhance pipeline failed; falling back to WASM', err);
      cache.device = 'wasm';
      pipeFn = await tryCreate('wasm');
    } else {
      throw err;
    }
  }

  if (task === 'remove-bg') cache.removeBg = pipeFn;
  else cache.upscale2x = pipeFn;
  return pipeFn;
}

async function rawToDataUrl(image: RawImageLike): Promise<string> {
  if (typeof image.toBlob === 'function') {
    try {
      const blob = await image.toBlob('image/png');
      return blobToDataUrl(blob);
    } catch {
      // fall through to buffer path
    }
  }
  return rgbaBufferToPngDataUrl(image.data, image.width, image.height, image.channels);
}

function firstImage(result: RawImageLike | RawImageLike[]): RawImageLike {
  return Array.isArray(result) ? result[0]! : result;
}

async function runEnhance(
  task: LocalEnhanceTask,
  source: string | Blob,
  onProgress?: ProgressCb,
): Promise<string> {
  let input: string;
  if (typeof source === 'string') {
    if (!isUsableImageSource(source)) {
      throw new Error('Unsupported image source for local enhance');
    }
    input = source;
  } else {
    input = await blobToDataUrl(source);
  }

  const pipe = await getOrCreatePipeline(task, onProgress);
  onProgress?.({ percent: 100, statusKey: 'enhance.status_running' });
  const out = firstImage(await pipe(input));
  onProgress?.({ percent: 100, statusKey: 'enhance.status_done' });
  return rawToDataUrl(out);
}

export async function removeBackground(
  source: string | Blob,
  onProgress?: ProgressCb,
): Promise<string> {
  return runEnhance('remove-bg', source, onProgress);
}

export async function upscale2x(source: string | Blob, onProgress?: ProgressCb): Promise<string> {
  return runEnhance('upscale-2x', source, onProgress);
}

/** Test helper — clears cached pipelines between suites. */
export function __resetLocalEnhanceCacheForTests(): void {
  cache.removeBg = undefined;
  cache.upscale2x = undefined;
  cache.device = undefined;
  envConfigured = false;
}
