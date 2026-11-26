import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import {
  createMaterialCatalog,
  DEFAULT_SITE_URL,
  inputSchemas,
  outputSchemas,
} from './catalog.mjs';

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const definitions = [
  [
    'bloomrender_list_collections',
    'listCollections',
    'List material collections',
    'List the built-in material categories and their actual counts. This local, read-only catalog does not include personal photos or generation history.',
  ],
  [
    'bloomrender_search_references',
    'searchReferences',
    'Search reference materials',
    'Search built-in materials by keyword in English or Traditional Chinese, optionally filtered by role. Returns stable pagination and SVG rasterization metadata.',
  ],
  [
    'bloomrender_get_reference',
    'getReference',
    'Get a reference material',
    'Get a catalog ID’s reference URL, prompt, license, and detail page. SVG references require rasterization before use by models that accept only PNG/JPEG/WebP.',
  ],
  [
    'bloomrender_compose_brief',
    'composeBrief',
    'Compose a material brief and recipe',
    'Compose selected catalog IDs in supplied order into a prompt, reference list, and BloomRender recipe link. The recipe shares IDs/settings only, not custom prompt text. This tool never generates images, reads browser data, or calls a provider. Do not supply API keys or personal image data.',
  ],
];

export function createBloomRenderServer({ siteUrl = DEFAULT_SITE_URL } = {}) {
  const catalog = createMaterialCatalog({ siteUrl });
  const server = new McpServer({ name: 'bloomrender-materials', version: '1.0.0' });
  for (const [name, method, title, description] of definitions) {
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema: inputSchemas[method],
        outputSchema: outputSchemas[method],
        annotations,
      },
      async (input) => {
        try {
          const output = catalog[method](input);
          return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output,
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text:
                  error instanceof Error ? error.message : 'Could not read the material catalog.',
              },
            ],
          };
        }
      },
    );
  }
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const siteUrl = process.env.BLOOMRENDER_SITE_URL ?? DEFAULT_SITE_URL;
    // Validate configuration before waiting for the first client message.
    createMaterialCatalog({ siteUrl });
    serveStdio(() => createBloomRenderServer({ siteUrl }), {
      onerror: () => process.stderr.write('BloomRender MCP transport error.\n'),
    });
  } catch {
    process.stderr.write(
      'BloomRender MCP could not start. Check BLOOMRENDER_SITE_URL and the local material catalog.\n',
    );
    process.exitCode = 1;
  }
}
