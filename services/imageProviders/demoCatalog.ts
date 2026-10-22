/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Maps generation contexts to bundled public/examples assets for demo mode.
 */

export type DemoAssetPair = {
  /** Sample input shown / loaded as the subject photo (optional for text-to-image). */
  before?: string;
  /** One or more result variants (cycled per call). */
  after: string[];
};

const ex = (name: string) => `/examples/${name}.webp`;

/**
 * Keys match `context` values passed through `runImageGeneration`.
 * Features without a dedicated example reuse the closest bundled pair.
 */
export const DEMO_ASSETS_BY_CONTEXT: Record<string, DemoAssetPair> = {
  generation: { after: [ex('generate-1'), ex('generate-2')] },
  edit: { before: ex('editor-before'), after: [ex('editor-after')] },
  filter: { before: ex('editor-before'), after: [ex('editor-after')] },
  adjustment: { before: ex('editor-before'), after: [ex('editor-after')] },
  'id-photo': {
    before: ex('idphoto-before'),
    after: [ex('idphoto-after'), ex('idphoto-after-2')],
  },
  portrait: {
    before: ex('idphoto-before'),
    after: [ex('portrait-1'), ex('portrait-2')],
  },
  travel: {
    before: ex('idphoto-before'),
    after: [ex('travel-1'), ex('travel-2')],
  },
  themed: {
    before: ex('idphoto-before'),
    after: [ex('portrait-1'), ex('portrait-2')],
  },
  'try-on': {
    before: ex('tryon-before'),
    after: [ex('tryon-after'), ex('tryon-after-2')],
  },
  couple: {
    before: ex('tryon-before'),
    after: [ex('travel-2')],
  },
  group: {
    before: ex('tryon-before'),
    after: [ex('travel-2')],
  },
  restore: {
    before: ex('restore-before'),
    after: [ex('restore-after')],
  },
};

export const DEMO_MODEL_ID = 'demo-samples';

export function demoAssetsForContext(context?: string): DemoAssetPair {
  if (context && DEMO_ASSETS_BY_CONTEXT[context]) {
    return DEMO_ASSETS_BY_CONTEXT[context];
  }
  return DEMO_ASSETS_BY_CONTEXT.generation;
}

/** Feature keys used when auto-loading sample inputs on feature pages. */
export type DemoFeatureKey =
  | 'generate'
  | 'editor'
  | 'idphoto'
  | 'portrait'
  | 'travel'
  | 'themed'
  | 'tryon'
  | 'couple'
  | 'group'
  | 'restore';

const FEATURE_TO_CONTEXT: Record<DemoFeatureKey, string> = {
  generate: 'generation',
  editor: 'edit',
  idphoto: 'id-photo',
  portrait: 'portrait',
  travel: 'travel',
  themed: 'themed',
  tryon: 'try-on',
  couple: 'couple',
  group: 'group',
  restore: 'restore',
};

export function demoAssetsForFeature(feature: DemoFeatureKey): DemoAssetPair {
  return demoAssetsForContext(FEATURE_TO_CONTEXT[feature]);
}
