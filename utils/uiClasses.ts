/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared UI class tokens for page shells, titles, cards, and buttons.
 * Taste PRESERVE: flat fills, consistent radius; theme surfaces via CSS vars.
 */

import type { ThemeType } from '../contexts/ThemeContext';

/** Standard feature page shell (padding + radius + border). Append theme surface. */
export const UI_PAGE =
  'w-full max-w-5xl mx-auto text-center px-4 py-6 sm:px-8 sm:py-8 transition-colors duration-300 rounded-2xl border';

/** Wider page shell (history / photography service). */
export const UI_PAGE_WIDE =
  'w-full max-w-6xl mx-auto text-center px-4 py-6 sm:px-8 sm:py-8 transition-colors duration-300 rounded-2xl border';

/** Vertical rhythm between major landing sections. */
export const UI_SECTION_STACK = 'flex flex-col gap-8 sm:gap-10';

export const UI_TITLE =
  'text-4xl font-semibold tracking-tight text-gray-100 sm:text-5xl md:text-6xl';

export const UI_SUBTITLE =
  'mx-auto max-w-[60ch] text-base md:text-lg text-gray-200 leading-relaxed';

export const UI_CARD = 'theme-raised border theme-border rounded-2xl';

export const UI_CARD_SOFT = 'theme-surface border theme-border rounded-2xl overflow-hidden';

export const UI_FORM_CARD = `${UI_CARD} p-6 flex flex-col gap-4 w-full max-w-2xl animate-fade-in`;

export const UI_LABEL = 'block text-sm font-medium theme-ink-muted mb-2';

export const UI_LABEL_HINT = 'block text-xs font-medium theme-ink-muted mb-1';

/**
 * Focus rings use `focus-visible` so keyboard users get a clear ring while
 * mouse/touch users don't see one linger after a click.
 */
const UI_FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]';

export const UI_INPUT = `w-full theme-raised border theme-border rounded-xl px-4 py-2.5 theme-ink placeholder:opacity-60 transition-colors ${UI_FOCUS_RING} focus-visible:brand-ring disabled:opacity-50 disabled:cursor-not-allowed`;

export const UI_SELECT = UI_INPUT;

export const UI_OPTION = `px-4 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${UI_FOCUS_RING} disabled:opacity-50 disabled:cursor-not-allowed`;

export const UI_OPTION_ACTIVE = `${UI_OPTION} brand-bg text-white theme-border-strong focus-visible:brand-ring`;

export const UI_OPTION_INACTIVE = `${UI_OPTION} theme-raised theme-ink-soft theme-border hover:opacity-90 focus-visible:brand-ring`;

export const UI_BTN = `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold cursor-pointer transition-colors duration-200 active:scale-[0.98] ${UI_FOCUS_RING} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`;

export const UI_BTN_PRIMARY = `${UI_BTN} brand-bg text-white hover:opacity-95 focus-visible:brand-ring`;

export const UI_BTN_SUCCESS = `${UI_BTN} bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-500`;

export const UI_BTN_SECONDARY = `${UI_BTN} theme-raised theme-ink border theme-border hover:opacity-90 focus-visible:brand-ring`;

export const UI_BTN_GHOST = `${UI_BTN} bg-transparent theme-ink-soft hover:opacity-90 border theme-border focus-visible:brand-ring`;

/** Primary generate CTA used on upload panels. */
export const UI_BTN_GENERATE = `${UI_BTN} px-8 py-3.5 font-bold brand-bg text-white hover:opacity-95 focus-visible:brand-ring`;

/** Large empty-state upload CTA. */
export const UI_BTN_UPLOAD = `${UI_BTN} px-10 py-5 text-xl font-bold brand-bg text-white hover:opacity-95 focus-visible:brand-ring`;

/** File picker label styled like a ghost button. */
export const UI_FILE_PICKER = `${UI_BTN_GHOST} cursor-pointer`;

export const UI_CHIP = `px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 border cursor-pointer ${UI_FOCUS_RING}`;

export const UI_CHIP_ACTIVE = `${UI_CHIP} brand-bg theme-border-strong text-white focus-visible:brand-ring`;

export const UI_CHIP_INACTIVE = `${UI_CHIP} theme-raised theme-border theme-ink-soft hover:opacity-90 focus-visible:brand-ring`;

/** Toggle option chip used in forms (spec / quantity / size). */
export function uiOption(active: boolean): string {
  return active ? UI_OPTION_ACTIVE : UI_OPTION_INACTIVE;
}

/** Theme-aware page surface (bg + border). Pair with UI_PAGE. */
export function getPageSurface(theme: ThemeType): string {
  if (theme === 'newyear') {
    return 'theme-surface theme-border';
  }
  if (theme === 'bloom') {
    return 'theme-surface theme-border';
  }
  return 'theme-surface theme-border';
}

/** Theme-aware title accent color. */
export function getTitleAccent(theme: ThemeType): string {
  if (theme === 'newyear') return 'text-yellow-300';
  if (theme === 'bloom') return 'brand-text-soft';
  return 'text-cyan-300';
}
