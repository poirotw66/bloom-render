/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * In-browser background removal and 2× upscaling (no API key).
 */

export {
  LOCAL_ENHANCE_MODELS,
  REMOVE_BG_MODEL,
  UPSCALE_2X_MODEL,
  modelForTask,
  type LocalEnhanceModelInfo,
  type LocalEnhanceTask,
} from './models';
export {
  normalizeHubProgress,
  aggregateFileProgress,
  type LocalEnhanceProgress,
  type HubProgressEvent,
} from './progress';
export { resolveEnhanceDevice, type LocalEnhanceDevice } from './device';
export { removeBackground, upscale2x, __resetLocalEnhanceCacheForTests } from './pipelines';
