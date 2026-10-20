import path from 'path';
// `defineConfig` from 'vitest/config' (not plain 'vite') so the `test` field
// below type-checks — vitest augments Vite's UserConfig type for it.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const pagesBase = process.env.GITHUB_PAGES === 'true';

  return {
    base: pagesBase ? '/bloom-render/' : '/',
    server: {
      port: 3002,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['logo/*.png', 'icons/*.png', 'og.png', 'favicon.ico'],
        manifest: {
          name: 'BloomRender',
          short_name: 'BloomRender',
          description:
            'Browser-based AI photo studio for ID photos, portraits, travel shots, try-on, and edits.',
          theme_color: '#111827',
          background_color: '#111827',
          display: 'standalone',
          // Relative to Vite `base` so GitHub Pages (`/bloom-render/`) stays correct.
          start_url: './',
          scope: './',
          lang: 'en',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // App shell + icons + small demo examples. Skip travel scene assets and model runtimes.
          globPatterns: [
            '**/*.{js,css,html,ico,webmanifest,woff2}',
            'icons/*.png',
            'logo/*.png',
            'examples/*.webp',
            'og.png',
          ],
          globIgnores: ['**/ort-wasm*.wasm', '**/transformers-*.js', '**/images/**'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          // SPA deep links: serve index.html for navigations (works with 404.html copy).
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Never cache AI / model host traffic.
              urlPattern: ({ url }) => {
                const host = url.hostname;
                return (
                  host.includes('googleapis.com') ||
                  host.includes('openrouter.ai') ||
                  host.includes('huggingface.co') ||
                  host.includes('hf.co') ||
                  host.includes('cdn.jsdelivr.net')
                );
              },
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      // transformers.js / onnxruntime-web ship their own WASM; pre-bundling breaks paths.
      exclude: ['@huggingface/transformers'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@google/genai')) {
                return 'gemini-sdk';
              }
              if (
                id.includes('@huggingface/transformers') ||
                id.includes('onnxruntime-web') ||
                id.includes('onnxruntime-common')
              ) {
                return 'transformers';
              }
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    esbuild: {
      // Do not drop `console` entirely — logger.warn/error rely on it in production.
      // Dev-only noise uses utils/logger (debug/info are no-ops when import.meta.env.DEV is false).
      drop: isProduction ? ['debugger'] : [],
    },
    test: {
      // Default stays 'node': jsdom's Blob is missing arrayBuffer()/text(),
      // which utils/historyDb.test.ts relies on, and its File size handling
      // differs enough to break utils/imageValidation.test.ts. Hook tests that
      // need a DOM opt in per-file with a `// @vitest-environment jsdom`
      // docblock instead of forcing jsdom on every suite.
      setupFiles: ['./test-setup.ts'],
    },
  };
});
