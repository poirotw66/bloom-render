/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Demo-mode results for viral templates: always use that template's own
 * thumbnail under public/examples/viral/<id>.webp (never generic generate-* /
 * airport / office samples). Optional light variations for regenerate.
 */

/** Public path (leading slash) for a viral template demo result. */
export function demoViralThumbnailPath(templateId: string): string {
  const id = templateId.trim();
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    throw new Error('error.demo_asset_missing');
  }
  return `/examples/viral/${id}.webp`;
}

/**
 * Resolve which bundled asset to show for a demo generation call.
 * Template-backed contexts require `viralTemplateId` and never fall back to
 * generic example rotations.
 */
export function resolveDemoResultAssetPath(options: {
  context?: string;
  viralTemplateId?: string;
}): string | null {
  const templateId = options.viralTemplateId?.trim();
  if (templateId) {
    return demoViralThumbnailPath(templateId);
  }
  const context = options.context || 'generation';
  if (context === 'viral-style' || context === 'multi-person') {
    return null;
  }
  return null;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('error.demo_asset_missing'));
    img.src = url;
  });
}

/**
 * Apply a light visual difference for regenerate versions while keeping the
 * same template content (crop / mirror / warm tint).
 * Falls back to the original data URL when Canvas/Image is unavailable (Node tests).
 */
export async function applyDemoViralVariation(
  dataUrl: string,
  variationIndex: number,
): Promise<string> {
  if (variationIndex <= 0) return dataUrl;
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return dataUrl;
  }

  try {
    const img = await loadImageElement(dataUrl);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    const kind = ((variationIndex - 1) % 3) + 1;
    if (kind === 1) {
      const scale = 0.9;
      const sw = w * scale;
      const sh = h * scale;
      ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, w, h);
    } else if (kind === 2) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
    } else {
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'rgba(255, 196, 120, 0.14)';
      ctx.fillRect(0, 0, w, h);
    }

    return canvas.toDataURL('image/webp', 0.85);
  } catch {
    return dataUrl;
  }
}
