/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Chromium-only smoke e2e. Kept fast: one browser, few navigations, preview
 * of a production build (same shell CI ships).
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer between 1 and 65535');
}
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Build once, then serve. CI also builds in quality-gate; e2e job builds
    // independently so the sibling job stays self-contained.
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      GITHUB_PAGES: 'false',
    },
  },
});
