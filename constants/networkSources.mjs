/**
 * Explicit browser network permissions. Attribution links do not grant access.
 * Shared by CSP generation, build validation and Workbox.
 */
export const NETWORK_SOURCES = [
  {
    id: 'gemini',
    origin: 'https://generativelanguage.googleapis.com',
    directives: ['connect-src'],
    networkOnly: true,
  },
  {
    id: 'openrouter',
    origin: 'https://openrouter.ai',
    directives: ['connect-src'],
    networkOnly: true,
  },
  {
    id: 'openai',
    origin: 'https://api.openai.com',
    directives: ['connect-src'],
    networkOnly: true,
  },
  {
    id: 'huggingface',
    origin: 'https://huggingface.co',
    directives: ['connect-src'],
    networkOnly: true,
  },
  {
    id: 'huggingface-lfs',
    origin: 'https://cdn-lfs.huggingface.co',
    directives: ['connect-src'],
    networkOnly: true,
  },
  {
    id: 'huggingface-lfs-us',
    origin: 'https://cdn-lfs-us-1.huggingface.co',
    directives: ['connect-src'],
    networkOnly: true,
  },
  { id: 'hf', origin: 'https://hf.co', directives: ['connect-src'], networkOnly: true },
  {
    id: 'wasm-cdn',
    origin: 'https://cdn.jsdelivr.net',
    directives: ['connect-src'],
    networkOnly: true,
  },
  {
    id: 'site-images',
    origin: 'https://www.bloss0m.com',
    directives: ['img-src'],
    networkOnly: false,
  },
];

export function validateNetworkSources(sources = NETWORK_SOURCES) {
  const errors = [];
  const ids = new Set();
  const origins = new Set();
  for (const source of sources) {
    const label = `network source ${source?.id ?? '(missing id)'}`;
    if (!source || typeof source.id !== 'string' || !source.id.trim()) {
      errors.push(`${label}: non-empty id required`);
      continue;
    }
    if (ids.has(source.id)) errors.push(`${label}: duplicate id`);
    ids.add(source.id);
    try {
      const url = new URL(source.origin);
      if (url.protocol !== 'https:' || url.origin !== source.origin || url.hostname.includes('*')) {
        errors.push(`${label}: use an exact HTTPS origin without path, credentials or wildcard`);
      }
    } catch {
      errors.push(`${label}: invalid HTTPS origin`);
    }
    if (origins.has(source.origin)) errors.push(`${label}: duplicate origin`);
    origins.add(source.origin);
    if (
      !Array.isArray(source.directives) ||
      source.directives.length === 0 ||
      source.directives.some((directive) => !['connect-src', 'img-src'].includes(directive)) ||
      new Set(source.directives).size !== source.directives.length
    ) {
      errors.push(`${label}: directives must contain unique connect-src or img-src permissions`);
    }
    if (typeof source.networkOnly !== 'boolean') {
      errors.push(`${label}: networkOnly boolean required`);
    }
    if (
      source.networkOnly &&
      (!Array.isArray(source.directives) || !source.directives.includes('connect-src'))
    ) {
      errors.push(`${label}: NetworkOnly requires connect-src`);
    }
  }
  return errors;
}

const registryErrors = validateNetworkSources();
if (registryErrors.length) throw new Error(registryErrors.join('\n'));

export const CONNECT_ORIGINS = NETWORK_SOURCES.filter((source) =>
  source.directives.includes('connect-src'),
).map((source) => source.origin);
export const IMAGE_ORIGINS = NETWORK_SOURCES.filter((source) =>
  source.directives.includes('img-src'),
).map((source) => source.origin);

const origin = (id) => NETWORK_SOURCES.find((source) => source.id === id).origin;
export const PROVIDER_ENDPOINTS = {
  openai: `${origin('openai')}/v1`,
  openrouterImages: `${origin('openrouter')}/api/v1/images`,
  openrouterModels: `${origin('openrouter')}/api/v1/models`,
  openrouterAuth: `${origin('openrouter')}/auth`,
  openrouterKeys: `${origin('openrouter')}/api/v1/auth/keys`,
};

// Workbox serializes this RegExp into the service worker without module closures.
export const NETWORK_ONLY_PATTERN = new RegExp(
  `^(?:${NETWORK_SOURCES.filter((source) => source.networkOnly)
    .map((source) => source.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?:/|$)`,
);
