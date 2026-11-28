import {
  CLOTHING_GENERATION_MANIFEST,
  GENERATED_CLOTHING,
  GENERATED_CLOTHING_SOURCE,
} from './generatedClothing.mjs';
import {
  GENERATED_REFERENCE_BATCH,
  REFERENCE_GENERATION_MANIFEST,
  GENERATED_REFERENCE_SOURCE,
} from './generatedReferenceBatch.mjs';
import { GENERATED_TARGET_BATCHES } from './generatedTargetBatches.mjs';

/** Build-time allowlist. Public manifests and catalog rows cannot authorize new images. */
export const GENERATED_MATERIAL_BATCHES = Object.freeze([
  {
    manifest: CLOTHING_GENERATION_MANIFEST,
    source: GENERATED_CLOTHING_SOURCE,
    kind: 'ai-generated-clothing-flatlay',
    imageFormat: 'png',
    entries: Object.fromEntries(
      Object.entries(GENERATED_CLOTHING).map(([id, category]) => [
        id,
        { role: 'clothing', clothing: { category } },
      ]),
    ),
  },
  {
    manifest: REFERENCE_GENERATION_MANIFEST,
    source: GENERATED_REFERENCE_SOURCE,
    kind: 'ai-generated-reference-batch',
    imageFormat: 'png',
    entries: GENERATED_REFERENCE_BATCH,
  },
  ...GENERATED_TARGET_BATCHES,
]);
