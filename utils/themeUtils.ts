/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Theme-based Tailwind class helpers. Use these instead of inline theme ternaries.
 * Taste PRESERVE: flat primary fills within each theme's hue family; no gradients / resting shadows.
 */

import type { ThemeType } from '../contexts/ThemeContext';

/** Editor page: tab bar, retouch form, input, primary submit button */
export interface EditorThemeClasses {
  tabContainer: string;
  tabActive: string;
  tabInactive: string;
  retouchInstruction: string;
  input: string;
  submitButton: string;
}

export function getEditorThemeClasses(theme: ThemeType): EditorThemeClasses {
  if (theme === 'newyear') {
    return {
      tabContainer: 'bg-red-950/40 border-red-800/50',
      tabActive: 'bg-red-600 text-white focus:ring-red-500',
      tabInactive: 'text-red-200 hover:text-red-50 hover:bg-red-500/20 focus:ring-red-500',
      retouchInstruction: 'text-red-300',
      input: 'bg-red-950/40 border-red-800/50 text-red-50 placeholder-red-300 focus:ring-red-500',
      submitButton: 'bg-red-600 hover:bg-red-500 disabled:bg-red-900 focus:ring-red-500 text-white',
    };
  }
  if (theme === 'bloom') {
    return {
      tabContainer: 'bg-gray-800/80 brand-border-soft',
      tabActive: 'brand-bg text-white brand-ring',
      tabInactive: 'text-gray-300 hover:text-white brand-bg-tint focus-visible:brand-ring',
      retouchInstruction: 'text-gray-300',
      input: 'bg-gray-800 border-gray-700 text-gray-200 focus-visible:brand-ring',
      submitButton: 'brand-bg-strong hover:opacity-95 text-white disabled:opacity-50 brand-ring',
    };
  }
  return {
    tabContainer: 'bg-gray-800/80 border-gray-700/80',
    tabActive: 'bg-blue-600 text-white focus:ring-blue-500',
    tabInactive: 'text-gray-300 hover:text-white hover:bg-white/10 focus:ring-blue-500',
    retouchInstruction: 'text-gray-400',
    input: 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500',
    submitButton:
      'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 focus:ring-blue-500 text-white',
  };
}

export const getThemeClasses = (theme: ThemeType) => {
  if (theme === 'newyear') {
    return {
      primary: 'red',
      primaryHover: 'red-500',
      primaryLight: 'red-400',
      primaryDark: 'red-600',
      primaryGradient: 'bg-red-600',
      primaryGradientHover: 'bg-red-500',
      bgCard: 'bg-red-950/40',
      bgCardHover: 'bg-red-500/20',
      bgOverlay: 'bg-red-950/50',
      bgHeader: 'bg-red-950/50',
      textPrimary: 'text-red-50',
      textSecondary: 'text-red-200',
      textMuted: 'text-red-300',
      border: 'border-red-800/50',
      borderHover: 'border-red-600',
      accent: 'yellow-400',
      accentHover: 'yellow-500',
      accentGradient: 'bg-yellow-500',
      success: 'green',
      successHover: 'green-500',
      successGradient: 'bg-green-600',
      shadowPrimary: '',
      shadowPrimaryHover: '',
      shadowAccent: '',
      shadowAccentHover: '',
      focusRing: 'focus:ring-red-500',
      focusRingAccent: 'focus:ring-yellow-500',
    };
  }

  if (theme === 'bloom') {
    return {
      primary: 'brand',
      primaryHover: 'brand',
      primaryLight: 'brand',
      primaryDark: 'brand',
      primaryGradient: 'brand-bg-strong',
      primaryGradientHover: 'brand-bg',
      bgCard: 'bg-gray-800',
      bgCardHover: 'bg-white/10',
      bgOverlay: 'bg-black/20',
      bgHeader: 'bg-gray-800/40',
      textPrimary: 'text-gray-100',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',
      border: 'brand-border-soft',
      borderHover: 'brand-border',
      accent: 'brand',
      accentHover: 'brand',
      accentGradient: 'brand-bg',
      success: 'green',
      successHover: 'green-500',
      successGradient: 'bg-green-600',
      shadowPrimary: '',
      shadowPrimaryHover: '',
      shadowAccent: '',
      shadowAccentHover: '',
      focusRing: 'focus-visible:brand-ring',
      focusRingAccent: 'focus-visible:brand-ring',
    };
  }

  // Night (深夜)
  return {
    primary: 'blue',
    primaryHover: 'blue-500',
    primaryLight: 'blue-400',
    primaryDark: 'blue-600',
    primaryGradient: 'bg-blue-600',
    primaryGradientHover: 'bg-blue-500',
    bgCard: 'bg-gray-800',
    bgCardHover: 'bg-white/10',
    bgOverlay: 'bg-black/20',
    bgHeader: 'bg-gray-800/40',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    border: 'border-gray-700',
    borderHover: 'border-gray-600',
    accent: 'cyan-400',
    accentHover: 'cyan-500',
    accentGradient: 'bg-cyan-500',
    success: 'green',
    successHover: 'green-500',
    successGradient: 'bg-green-600',
    shadowPrimary: '',
    shadowPrimaryHover: '',
    shadowAccent: '',
    shadowAccentHover: '',
    focusRing: 'focus:ring-blue-500',
    focusRingAccent: 'focus:ring-cyan-500',
  };
};
