import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { GENERATED_MATERIAL_BATCHES } from '../constants/generatedMaterialBatches.mjs';

/** Validate provenance and shipped bytes; image generation is intentionally not reproducible. */
export function validateGeneratedClothing(root, assetDir = path.join(root, 'public')) {
  const errors = [];
  const fail = (message) => errors.push(`generated references: ${message}`);
  let materials;
  try {
    materials = JSON.parse(readFileSync(path.join(root, 'constants/tryOnMaterials.json'), 'utf8'));
  } catch (error) {
    return [`generated references: cannot read catalog (${error.message})`];
  }
  const allIds = GENERATED_MATERIAL_BATCHES.flatMap((batch) => Object.keys(batch.entries));
  const generated = materials.filter((material) => material.license === 'LicenseRef-AI-Generated');
  const registered = materials.filter((material) => allIds.includes(material.id));
  if (registered.length !== generated.length || registered.length !== allIds.length)
    fail('reviewed reference IDs must retain their AI-generated provenance label');
  for (const batch of GENERATED_MATERIAL_BATCHES) {
    try {
      const manifest = JSON.parse(readFileSync(path.join(assetDir, batch.manifest), 'utf8'));
      if (
        manifest.v !== 1 ||
        manifest.kind !== batch.kind ||
        manifest.license !== 'LicenseRef-AI-Generated' ||
        manifest.source !== batch.source ||
        manifest.provider !== 'OpenAI' ||
        manifest.model !== 'gpt-image-2.6-sunburst' ||
        manifest.inputImages !== 0 ||
        manifest.settings?.n !== 1 ||
        manifest.settings?.size !== '1024x1024' ||
        manifest.settings?.quality !== 'medium' ||
        manifest.settings?.outputFormat !== 'png'
      )
        fail(
          `${batch.manifest}: manifest identity, model and generation settings must match the reviewed batch`,
        );
      const expectedIds = Object.keys(batch.entries);
      if (!Array.isArray(manifest.images) || manifest.images.length !== expectedIds.length) {
        fail(
          `${batch.manifest}: manifest must describe all ${expectedIds.length} reviewed references`,
        );
        continue;
      }
      const ids = manifest.images.map((image) => image.id);
      if (new Set(ids).size !== ids.length || expectedIds.some((id) => !ids.includes(id)))
        fail(`${batch.manifest}: catalog and manifest must contain the same unique IDs`);
      for (const image of manifest.images) {
        if (!Object.hasOwn(batch.entries, image.id)) {
          fail(`${image.id}: unregistered reference`);
          continue;
        }
        const expected = batch.entries[image.id];
        const material = generated.find((entry) => entry.id === image.id);
        const expectedPath = `images/tryon-materials/${image.id}.png`;
        const matchingClothing =
          expected.role !== 'clothing' ||
          material?.clothing?.category === expected.clothing.category;
        const matchingPose =
          expected.role !== 'pose' ||
          (material?.poseReference === undefined &&
            Object.entries(expected.pose).every(
              ([field, value]) => material?.pose?.[field] === value,
            ));
        if (
          !material ||
          material.role !== expected.role ||
          !matchingClothing ||
          !matchingPose ||
          material.image !== expectedPath ||
          image.image !== expectedPath ||
          material.source !== batch.source
        )
          fail(
            `${image.id}: catalog identity, metadata or provenance differs from the reviewed batch`,
          );
        if (typeof image.prompt !== 'string' || !image.prompt.trim())
          fail(`${image.id}: exact generation prompt is required`);
        const bytes = readFileSync(path.join(assetDir, expectedPath));
        if (createHash('sha256').update(bytes).digest('hex') !== image.sha256)
          fail(`${image.id}: image hash differs from manifest`);
        if (
          bytes.length < 24 ||
          bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
          bytes.readUInt32BE(16) !== 1024 ||
          bytes.readUInt32BE(20) !== 1024
        )
          fail(`${image.id}: expected a 1024 by 1024 PNG`);
      }
    } catch (error) {
      fail(`${batch.manifest}: cannot verify generation provenance (${error.message})`);
    }
  }
  return errors;
}
