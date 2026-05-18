import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/bloom-render/' : '/',
    server: {
      port: 3002,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
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
  };
});
