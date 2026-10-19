/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Branded share cards: result (optionally side-by-side with before) plus footer.
 */

export type ShareCardAspect = '1:1' | '9:16';

const SITE_URL = 'https://www.bloss0m.com/bloom-render/';
const FOOTER_TEXT = 'Made with BloomRender';

async function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image for share card'));
      img.src = url;
    });
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

function cardSize(aspect: ShareCardAspect): { width: number; height: number } {
  if (aspect === '9:16') return { width: 1080, height: 1920 };
  return { width: 1080, height: 1080 };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/**
 * Render a branded share card PNG blob.
 */
export async function renderShareCard(options: {
  result: string | Blob;
  before?: string | Blob | null;
  aspect?: ShareCardAspect;
  siteUrl?: string;
  footerLabel?: string;
}): Promise<Blob> {
  const aspect = options.aspect ?? '1:1';
  const { width, height } = cardSize(aspect);
  const footerH = Math.round(height * 0.1);
  const contentH = height - footerH;

  const resultImg = await loadImage(options.result);
  const beforeImg = options.before ? await loadImage(options.before) : null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = '#0c0a0f';
  ctx.fillRect(0, 0, width, height);

  if (beforeImg) {
    const half = width / 2;
    drawCover(ctx, beforeImg, 0, 0, half, contentH);
    drawCover(ctx, resultImg, half, 0, half, contentH);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, contentH);
    ctx.stroke();
  } else {
    drawCover(ctx, resultImg, 0, 0, width, contentH);
  }

  ctx.fillStyle = '#111018';
  ctx.fillRect(0, contentH, width, footerH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(footerH * 0.32)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const pad = Math.round(width * 0.04);
  ctx.fillText(options.footerLabel ?? FOOTER_TEXT, pad, contentH + footerH / 2 - footerH * 0.12);
  ctx.fillStyle = '#a78bfa';
  ctx.font = `500 ${Math.round(footerH * 0.22)}px Inter, system-ui, sans-serif`;
  ctx.fillText(options.siteUrl ?? SITE_URL, pad, contentH + footerH / 2 + footerH * 0.22);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Share card render failed'))),
      'image/png',
    );
  });
}

export { SITE_URL, FOOTER_TEXT };
