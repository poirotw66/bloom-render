/** Shared browser/build paths for the travel scene asset variants. */
export function sceneImageBasename(referenceImagePath) {
  const file = referenceImagePath.split('/').pop() ?? referenceImagePath;
  return file.replace(/\.[a-z0-9]+$/i, '');
}

export function sceneThumbPath(referenceImagePath, size = 256) {
  return `/images/scenes/thumbs/${size}/${sceneImageBasename(referenceImagePath)}.webp`;
}

export function sceneRefPath(referenceImagePath) {
  return `/images/scenes/ref/${sceneImageBasename(referenceImagePath)}.webp`;
}
