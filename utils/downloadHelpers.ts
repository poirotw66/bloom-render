/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared helpers for downloading generated images.
 */

/**
 * An image to download: either a `data:` URL (fresh generation results) or a
 * Blob (history entries, which are stored as Blobs).
 */
export type DownloadSource = string | Blob;

interface BatchDownloadOptions {
  sources: DownloadSource[];
  itemFileName: (index: number) => string;
  zipFileName: string;
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
  const { sources, itemFileName, zipFileName } = options;
  if (sources.length === 0) return;

  try {
    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    sources.forEach((source, index) => {
      if (typeof source === 'string') {
        zip.file(itemFileName(index), source.split(',')[1], { base64: true });
      } else {
        zip.file(itemFileName(index), source);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    triggerDownload(url, zipFileName);
    URL.revokeObjectURL(url);
  } catch {
    fallbackDownloadSequentially(sources, itemFileName);
  }
}
