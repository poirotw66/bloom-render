import { publicAssetUrl } from './publicAsset';
import type { TryOnMaterial } from '../constants/tryOnMaterials';

export async function materialFile(material: TryOnMaterial, signal: AbortSignal): Promise<File> {
  const response = await fetch(publicAssetUrl(material.image), { signal });
  if (!response.ok) throw new Error('error.network_error');
  const blob = await response.blob();
  if (!material.image.endsWith('.svg'))
    return new File([blob], `${material.id}.webp`, { type: blob.type });
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('error.invalid_image'));
      img.src = url;
    });
    signal.throwIfAborted();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || 768;
    canvas.height = image.naturalHeight || 1024;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('error.invalid_image');
    context.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('error.invalid_image'))),
        'image/png',
      ),
    );
    return new File([png], `${material.id}.png`, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
