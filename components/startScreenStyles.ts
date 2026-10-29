/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import type { ThemeType } from '../contexts/ThemeContext';

export const themeStyles = {
  bloom: {
    drag: 'brand-bg-tint border-dashed brand-border',
    slogan: 'brand-text-soft',
    border: 'brand-border-soft hover:brand-border',
    borderCard: 'brand-border-soft',
    btn: 'brand-bg focus-visible:brand-ring',
    btnSecondary: 'brand-bg-strong brand-border',
    inputFocus: 'focus-visible:brand-ring focus:brand-border',
    cardIcon: 'brand-bg-tint brand-border-soft',
    cardIconText: 'brand-text',
    generateBtn: 'brand-bg-strong hover:opacity-95 focus-visible:brand-ring',
    titleAccent: 'brand-text-soft',
  },
  night: {
    drag: 'bg-blue-500/10 border-dashed border-blue-400',
    slogan: 'text-slate-300',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    borderCard: 'border-slate-600/50',
    btn: 'bg-blue-600 focus-visible:ring-blue-400',
    btnSecondary: 'bg-blue-600 border-blue-500/50',
    inputFocus: 'focus-visible:ring-blue-500 focus:border-blue-500/50',
    cardIcon: 'bg-blue-500/20 border-blue-400/30',
    cardIconText: 'text-cyan-300',
    generateBtn: 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-500',
    titleAccent: 'text-cyan-300',
  },
  newyear: {
    drag: 'bg-red-500/10 border-dashed border-red-400',
    slogan: 'text-red-200',
    border: 'border-red-500/30 hover:border-red-400/50',
    borderCard: 'border-red-700/50',
    btn: 'bg-red-600 focus-visible:ring-red-400',
    btnSecondary: 'bg-red-600 border-red-500/50',
    inputFocus: 'focus-visible:ring-red-500 focus:border-red-500/50',
    cardIcon: 'bg-red-500/20 border-red-400/30',
    cardIconText: 'text-amber-300',
    generateBtn: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500',
    titleAccent: 'text-amber-300',
  },
} as const satisfies Record<ThemeType, Record<string, string>>;
