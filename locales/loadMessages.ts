/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export type Language = 'en' | 'zh-TW';
export type Messages = Record<string, string>;

declare const __LOCALE_CACHE_VERSION__: string;
declare const __LOCALE_MESSAGE_COUNTS__: Record<Language, number>;
const cacheVersion =
  typeof __LOCALE_CACHE_VERSION__ === 'undefined' ? 'test' : __LOCALE_CACHE_VERSION__;
const CACHE_NAME = `bloomrender-locale-messages:${import.meta.env.BASE_URL}`;
const loaded = new Map<Language, Messages>();
const pending = new Map<Language, Promise<Messages>>();

function cacheUrl(language: Language): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(`__locale-cache/${language}/${cacheVersion}`, base).href;
}

async function readOfflineMessages(language: Language): Promise<Messages | null> {
  try {
    if (typeof caches === 'undefined') return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(cacheUrl(language));
    if (!response) return null;
    const messages: unknown = await response.json();
    const expectedCount =
      typeof __LOCALE_MESSAGE_COUNTS__ === 'undefined'
        ? undefined
        : __LOCALE_MESSAGE_COUNTS__[language];
    return messages &&
      typeof messages === 'object' &&
      !Array.isArray(messages) &&
      'app.title' in messages &&
      'start.title_part1' in messages &&
      (expectedCount === undefined || Object.keys(messages).length === expectedCount) &&
      Object.values(messages).every(
        (message) => typeof message === 'string' && message.trim() !== '',
      )
      ? (messages as Messages)
      : null;
  } catch {
    return null;
  }
}

async function saveOfflineMessages(language: Language, messages: Messages): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    const cache = await caches.open(CACHE_NAME);
    const url = cacheUrl(language);
    await cache.put(url, new Response(JSON.stringify(messages)));
    // Retain only the current dictionary for each language, scoped to this app's base.
    const prefix = url.slice(0, url.lastIndexOf('/') + 1);
    for (const request of await cache.keys()) {
      if (request.url.startsWith(prefix) && request.url !== url) await cache.delete(request);
    }
  } catch {
    // Offline storage is optional, including in private browsing.
  }
}

export function getLoadedMessages(language: Language): Messages | undefined {
  return loaded.get(language);
}

/** Import only the requested dictionary; retain an exact-build copy for offline reloads. */
export function loadMessages(language: Language): Promise<Messages> {
  const cached = loaded.get(language);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(language);
  if (existing) return existing;

  const request = (async () => {
    let messages: Messages;
    try {
      messages =
        language === 'en'
          ? (await import('./en')).enMessages
          : (await import('./zh-TW')).zhTWMessages;
      void saveOfflineMessages(language, messages);
    } catch (error) {
      const offline = await readOfflineMessages(language);
      if (!offline) throw error;
      messages = offline;
    }
    loaded.set(language, messages);
    return messages;
  })().finally(() => pending.delete(language));
  pending.set(language, request);
  return request;
}
