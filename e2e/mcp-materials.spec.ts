import { openWorkspace } from './helpers/workspace';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('a recipe composed over MCP opens the selected materials in the real try-on workspace', async ({
  page,
  baseURL,
}) => {
  const client = new Client({ name: 'bloomrender-browser-bridge', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../mcp/server.mjs', import.meta.url))],
    env: { BLOOMRENDER_SITE_URL: `${baseURL}/` },
    stderr: 'pipe',
  });
  const apiRequests: string[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('bloom_language', 'en');
    localStorage.setItem('bloom_image_provider', 'openrouter');
  });
  await page.route(
    /https:\/\/(?:api\.openai\.com|openrouter\.ai|generativelanguage\.googleapis\.com)\//,
    async (route) => {
      apiRequests.push(route.request().url());
      await route.abort();
    },
  );
  try {
    await client.connect(transport);
    await client.listTools();
    const ids = ['white-oxford-shirt', 'pose-seated-profile', 'lighting-soft-window'];
    const result = await client.callTool({
      name: 'bloomrender_compose_brief',
      arguments: { materialIds: ids, language: 'en' },
    });
    expect(result.isError).not.toBe(true);
    const { recipeUrl } = result.structuredContent as { recipeUrl: string };
    await page.goto(recipeUrl);
    await expect(page).toHaveURL(/\/try-on$/);
    await expect(page.getByTestId('tryon-person-input')).toBeEnabled();
    await openWorkspace(page, 'Reference library');
    for (const id of ids)
      await expect(page.getByTestId(`tryon-material-${id}`)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Generate Try-On', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Please upload your photo first.');
    expect(apiRequests).toEqual([]);
  } finally {
    await client.close();
  }
});
