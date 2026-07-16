/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared UI class tokens for page shells, titles, cards, and buttons.
 * Keep feature accents (travel sky, try-on teal, couple pink) as overrides on top.
 */

import type { ThemeType } from '../contexts/ThemeContext';

/** Standard feature page shell (padding + radius + border + blur). Append theme surface. */
export const UI_PAGE =
  'w-full max-w-5xl mx-auto text-center px-4 py-6 sm:p-8 transition-all duration-300 rounded-2xl border-2 shadow-xl backdrop-blur-xl';

/** Wider page shell (history / photography service). */
export const UI_PAGE_WIDE =
  'w-full max-w-6xl mx-auto text-center px-4 py-6 sm:p-8 transition-all duration-300 rounded-2xl border-2 shadow-xl backdrop-blur-xl';

export const UI_TITLE =
  'text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl';

export const UI_SUBTITLE = 'max-w-3xl mx-auto text-lg text-gray-300 md:text-xl leading-relaxed';

export const UI_CARD =
  'bg-gray-800/40 border border-gray-700/50 rounded-2xl backdrop-blur-sm shadow-lg';

export const UI_CARD_SOFT =
  'bg-gray-900/50 border border-gray-700/60 rounded-2xl overflow-hidden shadow-lg';

export const UI_INPUT =
  'w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500';

export const UI_BTN =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';

export const UI_BTN_PRIMARY = `${UI_BTN} bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500`;

export const UI_BTN_SUCCESS = `${UI_BTN} bg-green-600 text-white hover:bg-green-500 focus:ring-green-500 shadow-lg shadow-green-600/20`;

export const UI_BTN_SECONDARY = `${UI_BTN} bg-gray-700 text-white hover:bg-gray-600 border border-gray-600 focus:ring-gray-500`;

export const UI_BTN_GHOST = `${UI_BTN} bg-transparent text-gray-300 hover:bg-white/10 border border-gray-600 focus:ring-gray-500`;

export const UI_CHIP =
  'px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800';

export const UI_CHIP_ACTIVE = `${UI_CHIP} bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 focus:ring-blue-500`;

export const UI_CHIP_INACTIVE = `${UI_CHIP} bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 focus:ring-gray-500`;

/** Theme-aware page surface (bg + border + shadow). Pair with UI_PAGE. */
export function getPageSurface(theme: ThemeType): string {
  if (theme === 'newyear') {
    return 'bg-red-900/30 border-red-700/50 shadow-red-900/25';
  }
  if (theme === 'bloom') {
    return 'bg-gray-900/40 border-fuchsia-500/15 shadow-fuchsia-500/10';
  }
  return 'bg-black/60 border-slate-700/60 shadow-slate-900/30';
}

/** Theme-aware title accent color. */
export function getTitleAccent(theme: ThemeType): string {
  if (theme === 'newyear') return 'text-red-200';
  if (theme === 'bloom') return 'text-fuchsia-200';
  return 'text-blue-200';
}
