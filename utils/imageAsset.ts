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
