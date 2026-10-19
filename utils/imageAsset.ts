/** MIME type for a public image path based on file extension. */
export function mimeTypeForImagePath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

/** Basename ref file for API upload from a scene reference path. */
export function referenceFileName(sceneId: string, referenceImagePath: string): string {
  const ext = referenceImagePath.match(/\.[a-z0-9]+$/i)?.[0] ?? '.webp';
  return `${sceneId}_ref${ext}`;
}

/**
 * Scene catalog paths look like `/images/scenes/eiffel.webp`.
 * Repo assets live under `thumbs/{256|512}/` (UI) and `ref/` (API).
 */
export function sceneImageBasename(referenceImagePath: string): string {
  const file = referenceImagePath.split('/').pop() ?? referenceImagePath;
  return file.replace(/\.[a-z0-9]+$/i, '');
}

/** UI thumbnail path derived from a catalog `referenceImagePath`. */
export function sceneThumbPath(referenceImagePath: string, size: 256 | 512 = 256): string {
  const base = sceneImageBasename(referenceImagePath);
  return `/images/scenes/thumbs/${size}/${base}.webp`;
}

/** Capped reference path (≤1536px long edge) for model uploads. */
export function sceneRefPath(referenceImagePath: string): string {
  const base = sceneImageBasename(referenceImagePath);
  return `/images/scenes/ref/${base}.webp`;
}
