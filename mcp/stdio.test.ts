import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { afterEach, describe, expect, it } from 'vitest';
import { Client, ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { getMaterialPrompt } from '../constants/poseMetadata.mjs';
import { SITE_URL } from '../constants/site';
import { parseTryOnRecipe, type TryOnRecipe } from '../types/tryOnRecipe';
import { parseRemixHash } from '../utils/remixLink';
import { validateMaterialBasketIds } from '../utils/materialBasket';

const entry = fileURLToPath(new URL('./server.mjs', import.meta.url));
const SECRET = 'mock-key-not-visible-to-material-tools';
const sessions: { client: Client; cwd: string }[] = [];
interface Reference {
  id: string;
  role: string;
  title: string;
  description: string;
  prompt: string;
  imageUrl: string;
  pageUrl: string;
  mimeType: string;
  requiresRasterization: boolean;
  license: string;
  source: string;
  slot?: number;
  pose?: { groupId: string; posture: string; view: string; cameraHeight: string; framing: string };
}
interface Composition {
  prompt: string;
  brief: string;
  references: Reference[];
  recipe: TryOnRecipe;
  recipeUrl: string;
  notes: string[];
}

async function connect(siteUrl?: string) {
  const cwd = await mkdtemp(join(tmpdir(), 'bloom-mcp-'));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    cwd,
    env: { OPENAI_API_KEY: SECRET, ...(siteUrl ? { BLOOMRENDER_SITE_URL: siteUrl } : {}) },
    stderr: 'pipe',
  });
  const errors: Error[] = [];
  let stderr = '';
  transport.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  const client = new Client({ name: 'bloomrender-protocol-test', version: '1.0.0' });
  client.onerror = (error) => errors.push(error);
  sessions.push({ client, cwd });
  await client.connect(transport);
  await client.listTools();
  return { client, transport, errors, stderr: () => stderr };
}

async function call<T>(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError).not.toBe(true);
  expect(result.structuredContent).toBeDefined();
  const text = result.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Missing text compatibility result');
  expect(JSON.parse(text.text)).toEqual(result.structuredContent);
  return result.structuredContent as T;
}

async function rejectTool(client: Client, name: string, args: Record<string, unknown>) {
  try {
    const result = await client.callTool({ name, arguments: args });
    expect(result.isError).toBe(true);
  } catch (error) {
    expect(error).toBeInstanceOf(ProtocolError);
    expect((error as ProtocolError).code).toBe(ProtocolErrorCode.InvalidParams);
  }
  await client.ping();
}

afterEach(async () => {
  for (const session of sessions.splice(0)) {
    await session.client.close();
    await rm(session.cwd, { recursive: true, force: true });
  }
});

describe('BloomRender MCP over real stdio', () => {
  it('advertises exactly four read-only tools and returns the actual catalog without stdout noise', async () => {
    const { client, errors, stderr } = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'bloomrender_compose_brief',
      'bloomrender_get_reference',
      'bloomrender_list_collections',
      'bloomrender_search_references',
    ]);
    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.outputSchema).toBeDefined();
    }
    const catalog = await call<{ collections: { role: string; count: number }[]; total: number }>(
      client,
      'bloomrender_list_collections',
    );
    expect(catalog.total).toBe(TRYON_MATERIALS.length);
    for (const collection of catalog.collections)
      expect(collection.count).toBe(
        TRYON_MATERIALS.filter((material) => material.role === collection.role).length,
      );
    expect(catalog.collections.map((item) => item.role).sort()).toEqual([
      'clothing',
      'lighting',
      'pose',
    ]);
    expect(JSON.stringify(catalog)).not.toContain(SECRET);
    expect(errors).toEqual([]);
    expect(stderr()).not.toContain(SECRET);
  });

  it('searches both languages, keeps pagination stable and returns no phantom items', async () => {
    const { client } = await connect();
    type Search = {
      items: Reference[];
      total: number;
      offset: number;
      limit: number;
      nextOffset: number | null;
    };
    const target = TRYON_MATERIALS.find((material) => material.id === 'pose-seated-profile')!;
    const chinese = await call<Search>(client, 'bloomrender_search_references', {
      query: target.titleZh,
      language: 'zh-TW',
    });
    expect(chinese.items.map((item) => item.id)).toContain(target.id);
    const english = await call<Search>(client, 'bloomrender_search_references', {
      query: 'SEATED',
      role: 'pose',
      language: 'en',
    });
    expect(english.items.map((item) => item.id)).toEqual([target.id]);
    const first = await call<Search>(client, 'bloomrender_search_references', {
      role: 'pose',
      offset: 0,
      limit: 1,
    });
    const second = await call<Search>(client, 'bloomrender_search_references', {
      role: 'pose',
      offset: first.nextOffset,
      limit: 1,
    });
    expect(first.total).toBe(3);
    expect(second.items[0].id).not.toBe(first.items[0].id);
    const none = await call<Search>(client, 'bloomrender_search_references', {
      query: 'does-not-exist',
    });
    expect(none.items).toEqual([]);
    expect(none.nextOffset).toBeNull();
  });

  it('resolves public deployment paths and accurately labels SVG references', async () => {
    const { client } = await connect();
    for (const material of TRYON_MATERIALS) {
      const ref = await call<Reference>(client, 'bloomrender_get_reference', {
        id: material.id,
        language: 'en',
      });
      expect(ref).toMatchObject({
        id: material.id,
        role: material.role,
        title: material.title,
        prompt: getMaterialPrompt(material, 'en'),
        license: material.license,
        source: material.source,
        mimeType: 'image/svg+xml',
        requiresRasterization: true,
      });
      expect(ref.imageUrl).toBe(new URL(material.image, SITE_URL).href);
      expect(ref.pageUrl).toBe(new URL(`materials/${material.id}`, SITE_URL).href);
      expect(new URL(ref.imageUrl).protocol).toBe('https:');
    }
  });

  it('filters structured pose and camera fields over stdio without changing reference IDs', async () => {
    const { client } = await connect();
    type Search = { items: Reference[]; total: number };
    const result = await call<Search>(client, 'bloomrender_search_references', {
      posture: 'seated',
      view: 'profile',
      cameraHeight: 'unspecified',
      framing: 'full-body',
      language: 'en',
    });
    expect(result.items.map((item) => item.id)).toEqual(['pose-seated-profile']);
    expect(result.items[0].pose).toEqual({
      groupId: 'seated',
      posture: 'seated',
      view: 'profile',
      cameraHeight: 'unspecified',
      framing: 'full-body',
    });
    expect(result.items[0].prompt).toContain('Pose and camera:');
    const empty = await call<Search>(client, 'bloomrender_search_references', {
      role: 'clothing',
      view: 'front',
    });
    expect(empty.total).toBe(0);
    const standing = await call<Search>(client, 'bloomrender_search_references', {
      groupId: 'relaxed-standing',
    });
    expect(standing.items.map((item) => item.id)).toEqual(['pose-relaxed-front']);
    expect(standing.items[0].imageUrl).toContain('pose-relaxed-front.svg');
    await rejectTool(client, 'bloomrender_search_references', { view: 'rear' });
    await rejectTool(client, 'bloomrender_search_references', { cameraHeight: '45 degrees' });
    const { tools } = await client.listTools();
    const inputSchema = tools.find(
      (tool) => tool.name === 'bloomrender_search_references',
    )!.inputSchema;
    expect(inputSchema.properties).toHaveProperty('view');
    expect(inputSchema.properties).toHaveProperty('cameraHeight');
    const outputSchema = tools.find(
      (tool) => tool.name === 'bloomrender_get_reference',
    )!.outputSchema;
    expect(outputSchema?.properties).toHaveProperty('pose');
  });

  it('composes ordered references and a browser-compatible recipe without leaking custom text into the URL', async () => {
    const { client } = await connect();
    const ids = ['lighting-soft-window', 'white-oxford-shirt', 'pose-hand-on-hip'];
    const prompt = 'PRIVATE_CUSTOM_TEXT: follow these references and keep a soft, natural look.';
    const result = await call<Composition>(client, 'bloomrender_compose_brief', {
      materialIds: ids,
      prompt,
      language: 'en',
    });
    expect(result.prompt).toBe(prompt);
    expect(result.brief).toContain(prompt);
    expect(result.references.map((item) => item.id)).toEqual(ids);
    expect(result.references.map((item) => item.slot)).toEqual([1, 2, 3]);
    expect(parseTryOnRecipe(result.recipe)).toEqual(result.recipe);
    expect(validateMaterialBasketIds(result.recipe.materialIds)).toEqual(ids);
    const link = new URL(result.recipeUrl);
    expect(link.pathname).toBe(new URL('r', SITE_URL).pathname);
    expect(parseRemixHash(link.hash)).toEqual({ v: 1, f: 'tryon', recipe: result.recipe });
    expect(link.hash.length - 1).toBeLessThanOrEqual(1500);
    expect(result.recipe.promptOverride).toBeUndefined();
    expect(Buffer.from(link.hash.slice(1), 'base64url').toString()).not.toContain(
      'PRIVATE_CUSTOM_TEXT',
    );
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(result.notes.join(' ')).toMatch(/SVG|raster/i);
  });

  it('rejects invalid inputs and conflicting selections while keeping the server alive', async () => {
    const { client } = await connect();
    const invalid: [string, Record<string, unknown>][] = [
      ['bloomrender_get_reference', { id: '../../.env' }],
      ['bloomrender_get_reference', { id: 'missing-material' }],
      ['bloomrender_get_reference', { id: 'white-oxford-shirt', apiKey: SECRET }],
      ['bloomrender_search_references', { limit: 0 }],
      ['bloomrender_search_references', { limit: 51 }],
      ['bloomrender_search_references', { offset: -1 }],
      ['bloomrender_search_references', { role: 'imaginary' }],
      ['bloomrender_search_references', { language: 'unknown' }],
      ['bloomrender_compose_brief', { materialIds: [] }],
      ['bloomrender_compose_brief', { materialIds: ['white-oxford-shirt', 'white-oxford-shirt'] }],
      ['bloomrender_compose_brief', { materialIds: ['pose-hand-on-hip', 'pose-seated-profile'] }],
      ['bloomrender_compose_brief', { materialIds: ['white-oxford-shirt'], prompt: '   ' }],
      [
        'bloomrender_compose_brief',
        { materialIds: ['white-oxford-shirt'], prompt: 'x'.repeat(8001) },
      ],
    ];
    for (const [name, args] of invalid) await rejectTool(client, name, args);
    const ref = await call<Reference>(client, 'bloomrender_get_reference', {
      id: 'white-oxford-shirt',
    });
    expect(ref.id).toBe('white-oxford-shirt');
  });

  it('honors a custom base path without depending on the launching working directory', async () => {
    const { client } = await connect('http://127.0.0.1:4196/custom/deployment/');
    const ref = await call<Reference>(client, 'bloomrender_get_reference', {
      id: 'white-oxford-shirt',
    });
    expect(ref.imageUrl).toBe(
      'http://127.0.0.1:4196/custom/deployment/images/tryon-materials/white-oxford-shirt.svg',
    );
    expect(ref.pageUrl).toBe(
      'http://127.0.0.1:4196/custom/deployment/materials/white-oxford-shirt',
    );
  });

  it('closes the child process cleanly when the MCP client disconnects', async () => {
    const { client, transport } = await connect();
    const pid = transport.pid;
    expect(pid).toBeTypeOf('number');
    await client.close();
    await expect
      .poll(() => {
        try {
          process.kill(pid!, 0);
          return true;
        } catch {
          return false;
        }
      })
      .toBe(false);
  });

  it('supports a 2025-era MCP client through the stdio compatibility handshake', async () => {
    const child = spawn(process.execPath, [entry], { stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = createInterface({ input: child.stdout });
    const exited = once(child, 'exit');
    let id = 0;
    function request(method: string, params?: Record<string, unknown>) {
      const requestId = ++id;
      return new Promise<Record<string, unknown>>((resolve, reject) => {
        const timer = setTimeout(() => {
          lines.off('line', onLine);
          reject(new Error('MCP response timed out'));
        }, 3000);
        function onLine(line: string) {
          try {
            const message = JSON.parse(line);
            if (message.id !== requestId) return;
            clearTimeout(timer);
            lines.off('line', onLine);
            if (message.error) reject(new Error(JSON.stringify(message.error)));
            else resolve(message.result);
          } catch (error) {
            clearTimeout(timer);
            lines.off('line', onLine);
            reject(error);
          }
        }
        lines.on('line', onLine);
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n');
      });
    }
    try {
      const handshake = await request('initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'legacy-bloom-test', version: '1.0.0' },
      });
      expect(handshake.protocolVersion).toBe('2025-06-18');
      child.stdin.write(
        JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
      );
      const result = await request('tools/list');
      expect(result.tools).toHaveLength(4);
      const called = await request('tools/call', {
        name: 'bloomrender_get_reference',
        arguments: { id: 'white-oxford-shirt' },
      });
      expect(called.structuredContent).toMatchObject({
        id: 'white-oxford-shirt',
        requiresRasterization: true,
      });
      child.stdin.end();
      await exited;
    } finally {
      lines.close();
      if (child.exitCode === null) child.kill();
    }
  });

  it('fails invalid startup configuration without exposing its credential or printing protocol noise', async () => {
    const child = spawn(process.execPath, [entry], {
      env: { BLOOMRENDER_SITE_URL: 'https://tester:PRIVATE_CONFIG_CREDENTIAL@example.invalid/' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    try {
      const [code] = await once(child, 'exit', { signal: AbortSignal.timeout(5000) });
      expect(code).not.toBe(0);
      expect(stdout).toBe('');
      expect(stderr).toBeTruthy();
      expect(stderr).not.toContain('PRIVATE_CONFIG_CREDENTIAL');
    } finally {
      if (child.exitCode === null) child.kill();
    }
  });
});
