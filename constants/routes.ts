/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Single source of truth for client-side route paths.
 */

export const ROUTES = {
  HOME: '/',
  GENERATE: '/generate',
  EDIT: '/edit',
  HISTORY: '/history',
  ID_PHOTO: '/idphoto',
  ID_PHOTO_BATCH: '/idphoto/batch',
  PORTRAIT: '/portrait',
  TRAVEL: '/travel',
  THEMED: '/themed',
  COUPLE_GROUP: '/couple-group',
  /** Multi-style viral collage (4–6 templates → one PNG). */
  STYLE_COLLAGE: '/style-collage',
  /** Multi-person viral synthesis (2–4 portraits + multi-person template). */
  MULTI_PERSON: '/multi-person',
  TRY_ON: '/try-on',
  PHOTOGRAPHY_SERVICE: '/photography-service',
  ENHANCE: '/enhance',
  RESTORE: '/restore',
  PROMPT_GALLERY: '/prompt-gallery',
  /** Remix deep link — payload lives in the URL hash only. */
  REMIX: '/r',
  /** OpenRouter OAuth PKCE callback (query: code, state). */
  OPENROUTER_OAUTH: '/oauth/openrouter',
} as const;

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Append query string to a route path (e.g. photography service deep links). */
export function buildRoute(path: AppRoutePath | string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }
  return `${path}?${new URLSearchParams(params).toString()}`;
}

export function isEditRoutePath(pathname: string): boolean {
  return pathname === ROUTES.EDIT || pathname.endsWith(ROUTES.EDIT);
}
