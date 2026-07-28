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

export const UI_FORM_CARD = `${UI_CARD} p-6 flex flex-col gap-4 w-full max-w-2xl animate-fade-in`;

export const UI_LABEL = 'block text-sm font-medium text-gray-400 mb-2';

export const UI_LABEL_HINT = 'block text-xs font-medium text-gray-500 mb-1';

/**
 * Focus rings use `focus-visible` so keyboard users get a clear ring while
 * mouse/touch users don't see one linger after a click.
 */
const UI_FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800';

export const UI_INPUT = `w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-500 transition-colors ${UI_FOCUS_RING} focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`;

export const UI_SELECT = UI_INPUT;

export const UI_OPTION = `px-4 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${UI_FOCUS_RING} disabled:opacity-50 disabled:cursor-not-allowed`;

export const UI_OPTION_ACTIVE = `${UI_OPTION} bg-blue-600 text-white border-blue-500 focus-visible:ring-blue-500`;

export const UI_OPTION_INACTIVE = `${UI_OPTION} bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 focus-visible:ring-gray-500`;

export const UI_BTN = `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-colors duration-200 active:scale-[0.98] ${UI_FOCUS_RING} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`;

export const UI_BTN_PRIMARY = `${UI_BTN} bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500`;

export const UI_BTN_SUCCESS = `${UI_BTN} bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-500 shadow-lg shadow-green-600/20`;

export const UI_BTN_SECONDARY = `${UI_BTN} bg-gray-700 text-white hover:bg-gray-600 border border-gray-600 focus-visible:ring-gray-500`;

export const UI_BTN_GHOST = `${UI_BTN} bg-transparent text-gray-300 hover:bg-white/10 border border-gray-600 focus-visible:ring-gray-500`;

/** Primary generate CTA used on upload panels. */
export const UI_BTN_GENERATE = `${UI_BTN} px-8 py-3.5 font-black bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500 shadow-lg shadow-blue-600/20`;

/** Large empty-state upload CTA. */
export const UI_BTN_UPLOAD = `${UI_BTN} px-10 py-5 text-xl font-black bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500 shadow-lg shadow-blue-600/30`;

/** File picker label styled like a ghost button. */
export const UI_FILE_PICKER = `${UI_BTN_GHOST} cursor-pointer`;

export const UI_CHIP = `px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border cursor-pointer ${UI_FOCUS_RING}`;

export const UI_CHIP_ACTIVE = `${UI_CHIP} bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 focus-visible:ring-blue-500`;

export const UI_CHIP_INACTIVE = `${UI_CHIP} bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 focus-visible:ring-gray-500`;

/** Toggle option chip used in forms (spec / quantity / size). */
export function uiOption(active: boolean): string {
  return active ? UI_OPTION_ACTIVE : UI_OPTION_INACTIVE;
}

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
