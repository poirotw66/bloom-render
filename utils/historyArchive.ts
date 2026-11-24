import type { StoredHistoryItem } from './historyDb';
import { normalizeHistoryReferences } from './historyDb';
import { parseTryOnRecipe } from '../types/tryOnRecipe';

const COMMON_OPTIONS = [
  'provider',
  'model',
  'prompt',
  'aspectRatio',
  'outputSize',
  'effectiveOutputSize',
  'imageSize',
  'quantity',
  'variationIndex',
];
const FEATURE_OPTIONS: Record<string, readonly string[]> = {
  generate: ['numberOfImages', 'hasReference', 'compare', 'slotIndex'],
  editor: ['tab', 'retouchMode'],
  idphoto: ['retouchLevel', 'idType', 'outputSpec', 'printSize', 'clothingOption', 'batchIndex'],
  portrait: ['portraitType', 'outputSpec'],
  themed: ['themeType'],
  travel: ['sceneId', 'style', 'isGroup', 'weather', 'time'],
  couple: ['style', 'fileCount'],
  group: ['style', 'fileCount'],
  tryon: ['background', 'style', 'clothingCount', 'keepBackground', 'keepPose'],
  restore: ['colorize', 'upscaleAfter'],
};

function safeText(value: string, limit = 2000): string {
  return value
    .slice(0, limit)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/(?:blob:|data:)[^\s"'<>]+/gi, '[redacted]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,})\b/g, '[redacted]');
}

/** An explicit allowlist keeps old arbitrary options and credentials out of portable archives. */
export function historyArchiveOptions(item: StoredHistoryItem): Record<string, unknown> {
  const source = item.options ?? {};
  const result: Record<string, unknown> = {};
  for (const key of [...COMMON_OPTIONS, ...(FEATURE_OPTIONS[item.type] ?? [])]) {
    const value = source[key];
    if (typeof value === 'string') result[key] = safeText(value, key === 'prompt' ? 16000 : 2000);
    else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)))
      result[key] = value;
  }
  if (item.type === 'tryon') {
    const recipe = parseTryOnRecipe(source.recipe);
    if (recipe) result.recipe = recipe;
  }
  return result;
}

function extension(blob: Blob): string {
  const formats: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  };
  return formats[blob.type] ?? 'bin';
}

/** Results and input blobs travel together. Names are generated, never interpreted as paths. */
export async function buildHistoryArchive(
  items: readonly StoredHistoryItem[],
  now = new Date(),
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const records = [];
  for (const [index, item] of items.entries()) {
    const directory = `records/${String(index + 1).padStart(3, '0')}`;
    const output = `${directory}/result.${extension(item.blob)}`;
    zip.file(output, await item.blob.arrayBuffer());
    const source = item.sourceBlob
      ? `${directory}/source.${extension(item.sourceBlob)}`
      : undefined;
    if (source && item.sourceBlob) zip.file(source, await item.sourceBlob.arrayBuffer());
    const references = [];
    for (const [referenceIndex, ref] of (
      normalizeHistoryReferences(item.references) ?? []
    ).entries()) {
      const file = `${directory}/${ref.role}-${referenceIndex + 1}.${extension(ref.blob)}`;
      zip.file(file, await ref.blob.arrayBuffer());
      references.push({
        role: ref.role,
        file,
        ...(ref.materialId && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ref.materialId)
          ? { materialId: ref.materialId.slice(0, 64) }
          : {}),
      });
    }
    const options = historyArchiveOptions(item);
    const clothingCount = references.filter((ref) => ref.role === 'clothing').length;
    records.push({
      id: safeText(item.id, 128),
      type: safeText(item.type, 64),
      timestamp: Number.isFinite(item.timestamp) ? item.timestamp : null,
      output,
      ...(source ? { source } : {}),
      references,
      options,
      ...(item.type === 'tryon'
        ? {
            inputsComplete: Boolean(
              source &&
              clothingCount > 0 &&
              (typeof options.clothingCount !== 'number' ||
                options.clothingCount === clothingCount),
            ),
          }
        : {}),
    });
  }
  zip.file(
    'metadata.json',
    JSON.stringify(
      {
        app: 'BloomRender',
        type: 'generation-history',
        version: 1,
        exportedAt: now.toISOString(),
        records,
      },
      null,
      2,
    ),
  );
  return zip.generateAsync({ type: 'blob' });
}

export async function downloadHistoryArchive(items: readonly StoredHistoryItem[]): Promise<void> {
  if (!items.length) return;
  const blob = await buildHistoryArchive(items);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bloomrender-history-${Date.now()}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
