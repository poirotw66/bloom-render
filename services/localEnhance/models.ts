/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Client-side enhance models (lazy-loaded via @huggingface/transformers).
 * Sizes are approximate download totals for the quantized ONNX artifacts.
 */

export type LocalEnhanceTask = 'remove-bg' | 'upscale-2x';

export interface LocalEnhanceModelInfo {
  task: LocalEnhanceTask;
  /** Hugging Face model id passed to `pipeline()`. */
  modelId: string;
  /** transformers.js pipeline task name. */
  pipelineTask: 'background-removal' | 'image-to-image';
  /** Human label for UI / README. */
  label: string;
  /** Approximate first-download size in megabytes. */
  approxSizeMb: number;
  /** Upstream model license identifier. */
  license: string;
  /** Hugging Face model card URL. */
  modelCardUrl: string;
  scale?: number;
}

/** MODNet-class matting (RMBG / BiRefNet family stand-in for browser size). */
export const REMOVE_BG_MODEL: LocalEnhanceModelInfo = {
  task: 'remove-bg',
  modelId: 'Xenova/modnet',
  pipelineTask: 'background-removal',
  label: 'MODNet (background removal)',
  approxSizeMb: 25,
  license: 'Apache-2.0',
  modelCardUrl: 'https://huggingface.co/Xenova/modnet',
};

/** Swin2SR classical ×2 — lightweight Real-ESRGAN / Swin2SR-class upscaler. */
export const UPSCALE_2X_MODEL: LocalEnhanceModelInfo = {
  task: 'upscale-2x',
  modelId: 'Xenova/swin2SR-classical-sr-x2-64',
  pipelineTask: 'image-to-image',
  label: 'Swin2SR classical ×2',
  approxSizeMb: 45,
  license: 'Apache-2.0',
  modelCardUrl: 'https://huggingface.co/Xenova/swin2SR-classical-sr-x2-64',
  scale: 2,
};

export const LOCAL_ENHANCE_MODELS: LocalEnhanceModelInfo[] = [REMOVE_BG_MODEL, UPSCALE_2X_MODEL];

export function modelForTask(task: LocalEnhanceTask): LocalEnhanceModelInfo {
  const found = LOCAL_ENHANCE_MODELS.find((m) => m.task === task);
  if (!found) throw new Error(`Unknown local enhance task: ${task}`);
  return found;
}
