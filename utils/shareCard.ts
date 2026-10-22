/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Branded share cards: result (optionally side-by-side with before) plus footer.
 * Optional remixUrl draws a scannable QR in the footer (Wave O).
 */

import QRCode from 'qrcode';

export type ShareCardAspect = '1:1' | '9:16';

const SITE_URL = 'https://www.bloss0m.com/bloom-render/';
const FOOTER_TEXT = 'Made with BloomRender';

/** Dark modules on white for reliable scans; near brand footer ink. */
const QR_DARK = '#111018';
const QR_LIGHT = '#ffffff';

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

function shortenDisplayUrl(url: string, maxChars: number): string {
  if (url.length <= maxChars) return url;
  const trimmed = url.replace(/^https?:\/\//, '');
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxChars - 1))}…`;
}

/**
 * Draw a remix QR into the footer bottom-right.
 * Exported for unit tests (mock `qrcode` / canvas as needed).
 */
export async function drawRemixQr(
  ctx: CanvasRenderingContext2D,
  remixUrl: string,
  footer: { x: number; y: number; width: number; height: number },
): Promise<void> {
  const size = Math.round(footer.height * 0.85);
  const quiet = Math.max(2, Math.round(size * 0.06));
  const outer = size + quiet * 2;
  const rightPad = Math.round(footer.width * 0.03);
  const qx = footer.x + footer.width - outer - rightPad;
  const qy = footer.y + Math.round((footer.height - outer) / 2);

  const dataUrl = await QRCode.toDataURL(remixUrl, {
    margin: 1,
    width: size,
    errorCorrectionLevel: 'M',
    color: { dark: QR_DARK, light: QR_LIGHT },
  });

  const qrImg = await loadImage(dataUrl);
  ctx.fillStyle = QR_LIGHT;
  ctx.fillRect(qx, qy, outer, outer);
  ctx.drawImage(qrImg, qx + quiet, qy + quiet, size, size);
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
  /** When set, draws a QR code for this remix URL in the footer. */
  remixUrl?: string;
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
  ctx.fillStyle = '#d946ef';
  ctx.font = `500 ${Math.round(footerH * 0.22)}px Inter, system-ui, sans-serif`;

  const siteUrl = options.siteUrl ?? SITE_URL;
  const qrReserve = options.remixUrl ? Math.round(footerH * 0.85) + Math.round(width * 0.08) : 0;
  const maxUrlChars = Math.max(18, Math.floor((width - pad * 2 - qrReserve) / (footerH * 0.12)));
  ctx.fillText(
    shortenDisplayUrl(siteUrl, maxUrlChars),
    pad,
    contentH + footerH / 2 + footerH * 0.22,
  );

  if (options.remixUrl) {
    await drawRemixQr(ctx, options.remixUrl, {
      x: 0,
      y: contentH,
      width,
      height: footerH,
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Share card render failed'))),
      'image/png',
    );
  });
}

export { SITE_URL, FOOTER_TEXT, QR_DARK, QR_LIGHT };
