/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Per-surface list of saved prompts (small strings, so localStorage is fine
 * here — unlike history results, there are no images to run out of quota
 * on). Each prompt surface (text-to-image, retouch, adjust, filter) keeps
 * its own list via a `scope` key, since a travel-scene prompt isn't a useful
 * suggestion in the ID photo retouch box.
 *
 * Unlike history, only one instance of a given scope is ever mounted at a
 * time, so plain component state + a persistence effect is enough — no
 * cross-instance sync needed.
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../utils/logger';

export interface SavedPrompt {
  id: string;
  text: string;
  createdAt: number;
}

export const MAX_SAVED_PROMPTS = 20;

const STORAGE_PREFIX = 'bloomrender_saved_prompts_';

function storageKeyFor(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

export function normalizePromptText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function isDuplicatePrompt(existing: SavedPrompt[], text: string): boolean {
  const normalized = normalizePromptText(text).toLowerCase();
  return existing.some((p) => p.text.toLowerCase() === normalized);
}

/** Prepend a new prompt, skipping duplicates and enforcing the retention cap. */
export function withSavedPrompt(
  existing: SavedPrompt[],
  text: string,
  max: number = MAX_SAVED_PROMPTS,
): SavedPrompt[] {
  const normalized = normalizePromptText(text);
  if (!normalized || isDuplicatePrompt(existing, normalized)) return existing;

  const prompt: SavedPrompt = {
    id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text: normalized,
    createdAt: Date.now(),
  };
  return [prompt, ...existing].slice(0, max);
}

export function withoutSavedPrompt(existing: SavedPrompt[], id: string): SavedPrompt[] {
  return existing.filter((p) => p.id !== id);
}

function loadSavedPrompts(scope: string): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(scope));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPrompt[]) : [];
  } catch (err) {
    logger.error('Failed to load saved prompts:', err);
    return [];
  }
}

export function useSavedPrompts(scope: string) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>(() => loadSavedPrompts(scope));

  // Re-load if the scope itself changes (callers pass a stable scope in practice).
  useEffect(() => {
    setPrompts(loadSavedPrompts(scope));
  }, [scope]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFor(scope), JSON.stringify(prompts));
    } catch (err) {
      logger.error('Failed to save prompts:', err);
    }
  }, [scope, prompts]);

  const savePrompt = useCallback((text: string) => {
    setPrompts((prev) => withSavedPrompt(prev, text));
  }, []);

  const removePrompt = useCallback((id: string) => {
    setPrompts((prev) => withoutSavedPrompt(prev, id));
  }, []);

  const isSaved = useCallback((text: string) => isDuplicatePrompt(prompts, text), [prompts]);

  return { prompts, savePrompt, removePrompt, isSaved };
}
