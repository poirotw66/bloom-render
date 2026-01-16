/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { ThemeType } from '../contexts/ThemeContext';

export const getThemeClasses = (theme: ThemeType) => {
  if (theme === 'newyear') {
    return {
      // Primary colors
      primary: 'red',
      primaryHover: 'red-500',
      primaryLight: 'red-400',
      primaryDark: 'red-600',
      primaryGradient: 'from-red-600 to-red-500',
      primaryGradientHover: 'from-red-500 to-red-400',
      
      // Background colors
      bgCard: 'bg-red-900/30',
      bgCardHover: 'bg-red-500/20',
      bgOverlay: 'bg-red-900/40',
      bgHeader: 'bg-red-900/40',
      
      // Text colors
      textPrimary: 'text-red-50',
      textSecondary: 'text-red-200',
      textMuted: 'text-red-300',
      
      // Border colors
      border: 'border-red-700/50',
      borderHover: 'border-red-600',
      
      // Accent colors
      accent: 'yellow-400',
      accentHover: 'yellow-500',
      accentGradient: 'from-yellow-500 to-yellow-400',
      
      // Success colors
      success: 'green',
      successHover: 'green-500',
      successGradient: 'from-green-600 to-green-500',
      
      // Shadow colors
      shadowPrimary: 'shadow-red-500/20',
      shadowPrimaryHover: 'shadow-red-500/40',
      shadowAccent: 'shadow-yellow-500/20',
      shadowAccentHover: 'shadow-yellow-500/40',
      
      // Focus ring
      focusRing: 'focus:ring-red-500',
      focusRingAccent: 'focus:ring-yellow-500',
    };
  }
  
  // Default theme
  return {
    // Primary colors
    primary: 'blue',
    primaryHover: 'blue-500',
    primaryLight: 'blue-400',
    primaryDark: 'blue-600',
    primaryGradient: 'from-blue-600 to-blue-500',
    primaryGradientHover: 'from-blue-500 to-blue-400',
    
    // Background colors
    bgCard: 'bg-gray-800',
    bgCardHover: 'bg-white/10',
    bgOverlay: 'bg-black/20',
    bgHeader: 'bg-gray-800/40',
    
    // Text colors
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    
    // Border colors
    border: 'border-gray-700',
    borderHover: 'border-gray-600',
    
    // Accent colors
    accent: 'cyan-400',
    accentHover: 'cyan-500',
    accentGradient: 'from-cyan-500 to-cyan-400',
    
    // Success colors
    success: 'green',
    successHover: 'green-500',
    successGradient: 'from-green-600 to-green-500',
    
    // Shadow colors
    shadowPrimary: 'shadow-blue-500/20',
    shadowPrimaryHover: 'shadow-blue-500/40',
    shadowAccent: 'shadow-cyan-500/20',
    shadowAccentHover: 'shadow-cyan-500/40',
    
    // Focus ring
    focusRing: 'focus:ring-blue-500',
    focusRingAccent: 'focus:ring-cyan-500',
  };
};
