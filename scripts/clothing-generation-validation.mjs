import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CLOTHING_GENERATION_MANIFEST,
  GENERATED_CLOTHING,
  GENERATED_CLOTHING_SOURCE,
} from '../constants/generatedClothing.mjs';

/** Validate provenance and shipped bytes; image generation is intentionally not reproducible. */
export function validateGeneratedClothing(root, assetDir = path.join(root, 'public')) {
  const errors = [];
  const fail = (message) => errors.push(`generated clothing: ${message}`);
  let materials;
  try {
    materials = JSON.parse(readFileSync(path.join(root, 'constants/tryOnMaterials.json'), 'utf8'));
    const generated = materials.filter(
      (material) => material.license === 'LicenseRef-AI-Generated',
    );
    const registered = materials.filter((material) =>
      Object.hasOwn(GENERATED_CLOTHING, material.id),
    );
    if (registered.length !== generated.length)
      fail('reviewed garment IDs must retain their AI-generated provenance label');
    const manifest = JSON.parse(
      readFileSync(path.join(assetDir, CLOTHING_GENERATION_MANIFEST), 'utf8'),
    );
    if (
      manifest.v !== 1 ||
      manifest.kind !== 'ai-generated-clothing-flatlay' ||
      manifest.license !== 'LicenseRef-AI-Generated' ||
      manifest.source !== GENERATED_CLOTHING_SOURCE ||
      manifest.provider !== 'OpenAI' ||
      manifest.model !== 'gpt-image-2.6-sunburst' ||
      manifest.inputImages !== 0 ||
      manifest.settings?.n !== 1 ||
      manifest.settings?.size !== '1024x1024' ||
      manifest.settings?.quality !== 'medium' ||
      manifest.settings?.outputFormat !== 'png'
    )
      fail('manifest identity, model and generation settings must match the reviewed batch');
    if (
      !Array.isArray(manifest.images) ||
      manifest.images.length !== Object.keys(GENERATED_CLOTHING).length
    )
      return [
        ...errors,
        'generated clothing: manifest must describe all twelve reviewed flat lays',
      ];
    const ids = manifest.images.map((image) => image.id);
    if (new Set(ids).size !== ids.length || generated.length !== ids.length)
      fail('catalog and manifest must contain the same twelve unique IDs');
    for (const image of manifest.images) {
      if (!Object.hasOwn(GENERATED_CLOTHING, image.id)) {
        fail(`${image.id}: unregistered garment`);
        continue;
      }
      const material = generated.find((entry) => entry.id === image.id);
      const expectedPath = `images/tryon-materials/${image.id}.png`;
      if (
        !material ||
        material.role !== 'clothing' ||
        material.clothing?.category !== GENERATED_CLOTHING[image.id] ||
        material.image !== expectedPath ||
        image.image !== expectedPath ||
        material.source !== GENERATED_CLOTHING_SOURCE
      )
        fail(
          `${image.id}: catalog identity, category or provenance differs from the reviewed batch`,
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
    fail(`cannot verify generation provenance (${error.message})`);
  }
  return errors;
}
