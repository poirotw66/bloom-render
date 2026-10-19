import { demoImageProvider } from './demoProvider';
import { geminiImageProvider } from './geminiProvider';
import { openRouterImageProvider } from './openRouterProvider';
import type { ImageProvider, ImageProviderId } from './types';

const PROVIDERS: Record<ImageProviderId, ImageProvider> = {
  gemini: geminiImageProvider,
  openrouter: openRouterImageProvider,
  demo: demoImageProvider,
};

export function getImageProvider(id: ImageProviderId): ImageProvider {
  return PROVIDERS[id];
}
