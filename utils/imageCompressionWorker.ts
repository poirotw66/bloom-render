/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Web Worker for image compression using OffscreenCanvas.
 * Runs compression in background thread to avoid blocking UI.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface CompressionMessage {
  id: string;
  type: 'compress';
  imageData: ArrayBuffer;
  options: CompressionOptions;
}

export interface CompressionResult {
  id: string;
  type: 'success' | 'error';
  data?: ArrayBuffer;
  error?: string;
}

// Create worker instance
let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    // Create inline worker code as blob URL
    const workerCode = `
      self.onmessage = async function(e) {
        const { id, type, imageData, options } = e.data;
        
        if (type !== 'compress') {
          self.postMessage({ id, type: 'error', error: 'Unknown message type' });
          return;
        }
        
        try {
          const { maxWidth = 2048, maxHeight = 2048, quality = 0.85, mimeType = 'image/jpeg' } = options;
          
          // Create ImageBitmap from ArrayBuffer
          const blob = new Blob([imageData]);
          const imageBitmap = await createImageBitmap(blob);
          
          // Calculate new dimensions
          let { width, height } = imageBitmap;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Create OffscreenCanvas
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get 2d context');
          }
          
          // Draw and compress
          ctx.drawImage(imageBitmap, 0, 0, width, height);
          const compressedBlob = await canvas.convertToBlob({ 
            type: mimeType, 
            quality: quality 
          });
          
          // Convert to ArrayBuffer
          const compressedData = await compressedBlob.arrayBuffer();
          
          // Transfer ownership for better performance
          self.postMessage(
            { id, type: 'success', data: compressedData },
            [compressedData]
          );
          
          // Cleanup
          imageBitmap.close();
        } catch (error) {
          self.postMessage({ 
            id, 
            type: 'error', 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
  }
  
  return worker;
}

/**
 * Compress an image file using Web Worker (non-blocking).
 * @param file Original image file
 * @param options Compression options
 * @returns Compressed File
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Create unique ID for this compression task
  const id = `compress-${Date.now()}-${Math.random()}`;

  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    // Set up message handler
    const handleMessage = (e: MessageEvent<CompressionResult>) => {
      if (e.data.id !== id) return;

      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);

      if (e.data.type === 'success' && e.data.data) {
        // Create new File from compressed data
        const compressedBlob = new Blob([e.data.data], { type: mimeType });
        const compressedFile = new File(
          [compressedBlob],
          file.name.replace(/\.[^.]+$/, `.${mimeType.split('/')[1]}`),
          { type: mimeType }
        );
        resolve(compressedFile);
      } else {
        reject(new Error(e.data.error || 'Compression failed'));
      }
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      reject(new Error(error.message || 'Worker error'));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    // Send compression task
    const message: CompressionMessage = {
      id,
      type: 'compress',
      imageData: arrayBuffer,
      options: { maxWidth, maxHeight, quality, mimeType },
    };

    // Transfer ownership for better performance
    worker.postMessage(message, [arrayBuffer]);
  });
}

/**
 * Cleanup worker when no longer needed.
 */
export function cleanupWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
