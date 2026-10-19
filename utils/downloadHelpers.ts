/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared helpers for downloading generated images.
 */

import { exportImageBlob, type ImageExportFormat, withExtension } from './imageExport';

/**
 * An image to download: either a `data:` URL (fresh generation results) or a
 * Blob (history entries, which are stored as Blobs).
 */
export type DownloadSource = string | Blob;

interface BatchDownloadOptions {
  sources: DownloadSource[];
  itemFileName: (index: number) => string;
  zipFileName: string;
  /** Convert each item before zipping (default keeps original bytes). */
  format?: ImageExportFormat;
  quality?: number;
}

function triggerDownload(href: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
}

function fallbackDownloadSequentially(
  sources: DownloadSource[],
  itemFileName: (index: number) => string,
): void {
  sources.forEach((source, index) => {
    setTimeout(() => {
      if (typeof source === 'string') {
        triggerDownload(source, itemFileName(index));
        return;
      }
      const url = URL.createObjectURL(source);
      triggerDownload(url, itemFileName(index));
      // The click starts the download synchronously, but revoking immediately
      // can race it in some browsers, so give it a moment.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, index * 100);
  });
}

/**
 * Download the given images as a ZIP. If ZIP creation fails, fall back to
 * sequential single downloads.
 */
export async function downloadBatchWithZipFallback(options: BatchDownloadOptions): Promise<void> {
  const { sources, itemFileName, zipFileName, format, quality = 0.92 } = options;
  if (sources.length === 0) return;

  try {
    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      const name = format ? withExtension(itemFileName(index), format) : itemFileName(index);
      if (format) {
        const blob = await exportImageBlob(source, format, quality);
        zip.file(name, blob);
      } else if (typeof source === 'string') {
        zip.file(name, source.split(',')[1], { base64: true });
      } else {
        zip.file(name, source);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    triggerDownload(url, zipFileName);
    URL.revokeObjectURL(url);
  } catch {
    fallbackDownloadSequentially(sources, itemFileName);
  }
}
