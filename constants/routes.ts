/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single source of truth for client-side route paths.
 */

export const ROUTES = {
  HOME: '/',
  GENERATE: '/generate',
  EDIT: '/edit',
  ID_PHOTO: '/idphoto',
  PORTRAIT: '/portrait',
  TRAVEL: '/travel',
  THEMED: '/themed',
  COUPLE_GROUP: '/couple-group',
  TRY_ON: '/try-on',
  PHOTOGRAPHY_SERVICE: '/photography-service',
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
