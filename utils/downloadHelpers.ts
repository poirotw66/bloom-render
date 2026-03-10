/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared helpers for downloading generated images.
 */

interface BatchDownloadOptions {
  dataUrls: string[];
  itemFileName: (index: number) => string;
  zipFileName: string;
}

function fallbackDownloadSequentially(
  dataUrls: string[],
  itemFileName: (index: number) => string,
): void {
  dataUrls.forEach((dataUrl, index) => {
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = itemFileName(index);
      link.click();
    }, index * 100);
  });
}

/**
 * Download data URLs as a ZIP. If ZIP creation fails, fallback to sequential single downloads.
 */
export async function downloadBatchWithZipFallback(options: BatchDownloadOptions): Promise<void> {
  const { dataUrls, itemFileName, zipFileName } = options;
  if (dataUrls.length === 0) return;

  try {
    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    dataUrls.forEach((dataUrl, index) => {
      const base64 = dataUrl.split(',')[1];
      zip.file(itemFileName(index), base64, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = zipFileName;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    fallbackDownloadSequentially(dataUrls, itemFileName);
  }
}
