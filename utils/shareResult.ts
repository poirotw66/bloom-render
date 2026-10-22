/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Share a result image via Web Share API, clipboard, or download fallback.
 */

import { exportImageBlob, triggerBlobDownload, withExtension } from './imageExport';
import { renderShareCard, type ShareCardAspect } from './shareCard';

export type ShareOutcome = 'shared' | 'clipboard' | 'downloaded';

async function toPngFile(source: string | Blob, name: string): Promise<File> {
  const blob = await exportImageBlob(source, 'png');
  return new File([blob], withExtension(name, 'png'), { type: 'image/png' });
}

async function tryNavigatorShare(file: File, title: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  const data: ShareData = { files: [file], title, text: title };
  if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
    return false;
  }
  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    // User cancel should not fall through to clipboard/download.
    if (err instanceof DOMException && err.name === 'AbortError') return true;
    return false;
  }
}

async function tryClipboardWrite(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) return false;
  if (typeof ClipboardItem === 'undefined') return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Share `source` as a PNG file. Prefers navigator.share, then clipboard, then download.
 */
export async function shareResultImage(options: {
  source: string | Blob;
  fileName?: string;
  title?: string;
}): Promise<ShareOutcome> {
  const fileName = options.fileName ?? 'bloomrender-result.png';
  const title = options.title ?? 'BloomRender';
  const file = await toPngFile(options.source, fileName);

  if (await tryNavigatorShare(file, title)) return 'shared';
  if (await tryClipboardWrite(file)) return 'clipboard';

  triggerBlobDownload(file, file.name);
  return 'downloaded';
}

/**
 * Share a branded card (optionally before/after). Same fallback chain.
 */
export async function shareBrandedCard(options: {
  result: string | Blob;
  before?: string | Blob | null;
  aspect?: ShareCardAspect;
  fileName?: string;
  title?: string;
  /** Optional “用同款” remix URL drawn as a QR on the card footer. */
  remixUrl?: string;
}): Promise<ShareOutcome> {
  const blob = await renderShareCard({
    result: options.result,
    before: options.before,
    aspect: options.aspect,
    remixUrl: options.remixUrl,
  });
  const fileName = options.fileName ?? `bloomrender-card-${options.aspect ?? '1x1'}.png`;
  const title = options.title ?? 'BloomRender';
  const file = new File([blob], withExtension(fileName, 'png'), { type: 'image/png' });

  if (await tryNavigatorShare(file, title)) return 'shared';
  if (await tryClipboardWrite(file)) return 'clipboard';

  triggerBlobDownload(file, file.name);
  return 'downloaded';
}
