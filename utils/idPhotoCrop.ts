/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Crop a generated ID photo to an exact pixel size at print DPI.
 * Uses FaceDetector when available; otherwise a centered / top-biased crop.
 */

export type FaceBox = { x: number; y: number; width: number; height: number };

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Compute a source crop rect of aspect `targetW/targetH` from an image of
 * `srcW×srcH`. When `face` is provided, keep the face near ID proportions
 * (roughly 70–80% of frame height, eyes toward the upper half).
 */
export function computeIdPhotoCropRect(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  face?: FaceBox | null,
): CropRect {
  const targetAspect = targetW / targetH;

  let sw: number;
  let sh: number;
  if (srcW / srcH > targetAspect) {
    sh = srcH;
    sw = sh * targetAspect;
  } else {
    sw = srcW;
    sh = sw / targetAspect;
  }

  let sx = (srcW - sw) / 2;
  let sy = (srcH - sh) / 2;

  if (face && face.width > 0 && face.height > 0) {
    // Aim for face height ≈ 75% of the crop, horizontally centered on the face.
    const desiredFaceHeight = sh * 0.75;
    const scale = face.height > 0 ? desiredFaceHeight / face.height : 1;
    // Recompute crop window around the face at that scale, clamped to the image.
    let faceSw = sw / scale;
    let faceSh = sh / scale;
    if (faceSw > srcW) {
      const f = srcW / faceSw;
      faceSw = srcW;
      faceSh *= f;
    }
    if (faceSh > srcH) {
      const f = srcH / faceSh;
      faceSh = srcH;
      faceSw *= f;
    }
    // Keep target aspect.
    if (faceSw / faceSh > targetAspect) {
      faceSw = faceSh * targetAspect;
    } else {
      faceSh = faceSw / targetAspect;
    }

    const faceCx = face.x + face.width / 2;
    const faceCy = face.y + face.height * 0.4; // bias toward eyes
    sx = clamp(faceCx - faceSw / 2, 0, srcW - faceSw);
    sy = clamp(faceCy - faceSh * 0.45, 0, srcH - faceSh);
    sw = faceSw;
    sh = faceSh;
  } else {
    // Top-biased center: ID faces sit slightly above geometric center.
    sy = clamp((srcH - sh) * 0.35, 0, srcH - sh);
  }

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(sw),
    sh: Math.round(sh),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

async function detectFaceBox(bitmap: ImageBitmap): Promise<FaceBox | null> {
  type FaceDetectorCtor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
    detect: (image: ImageBitmap) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
  };
  const Detector = (globalThis as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
  if (!Detector) return null;
  try {
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(bitmap);
    const box = faces[0]?.boundingBox;
    if (!box || box.width <= 0 || box.height <= 0) return null;
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  } catch {
    return null;
  }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for ID crop'));
    img.src = source;
  });
}

/**
 * Crop `source` (data URL or blob URL) to exact `targetW×targetH` pixels.
 * Returns a PNG data URL.
 */
export async function cropIdPhotoToSize(
  source: string,
  targetW: number,
  targetH: number,
): Promise<string> {
  const img = await loadImage(source);
  let face: FaceBox | null = null;
  try {
    const bitmap = await createImageBitmap(img);
    face = await detectFaceBox(bitmap);
    bitmap.close();
  } catch {
    face = null;
  }

  const rect = computeIdPhotoCropRect(img.naturalWidth, img.naturalHeight, targetW, targetH, face);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/png');
}
