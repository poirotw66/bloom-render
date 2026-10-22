/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

export type ThemeType = 'bloom' | 'night' | 'newyear';

interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;

  // Background colors
  bgMain: string;
  bgCard: string;
  bgCardHover: string;
  bgOverlay: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Border colors
  border: string;
  borderHover: string;

  // Accent colors
  accent: string;
  accentHover: string;
  success: string;
  successHover: string;

  // Background gradients
  bgGradient1: string;
  bgGradient2: string;
  bgGradient3: string;
  bgGradient4: string;
}

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_THEME = 'pixshop_theme';

/** 繁花 (Bloom): dark base with fuchsia → pink */
const bloomColors: ThemeColors = {
  primary: 'brand',
  primaryHover: 'brand',
  primaryLight: 'brand',
  primaryDark: 'brand',
  bgMain: '#121016',
  bgCard: 'gray-800',
  bgCardHover: 'white/10',
  bgOverlay: 'black/20',
  textPrimary: 'gray-100',
  textSecondary: 'gray-300',
  textMuted: 'gray-400',
  border: 'gray-700',
  borderHover: 'gray-600',
  accent: 'pink-400',
  accentHover: 'pink-500',
  success: 'green',
  successHover: 'green-500',
  bgGradient1: 'rgba(217, 70, 239, 0.14)',
  bgGradient2: 'rgba(244, 114, 182, 0.12)',
  bgGradient3: 'rgba(232, 121, 249, 0.1)',
  bgGradient4: '#121016',
};

/** 深夜 (Night): cool near-black, blue → cyan */
const nightColors: ThemeColors = {
  primary: 'blue',
  primaryHover: 'blue-500',
  primaryLight: 'blue-400',
  primaryDark: 'blue-600',
  bgMain: '#0a0c10',
  bgCard: 'gray-800',
  bgCardHover: 'white/10',
  bgOverlay: 'black/20',
  textPrimary: 'gray-50',
  textSecondary: 'gray-200',
  textMuted: 'gray-300',
  border: 'gray-700',
  borderHover: 'gray-600',
  accent: 'cyan-400',
  accentHover: 'cyan-500',
  success: 'green',
  successHover: 'green-500',
  bgGradient1: 'transparent',
  bgGradient2: 'transparent',
  bgGradient3: 'transparent',
  bgGradient4: '#0a0c10',
};

/** 新年 (New Year): deep red with gold/yellow */
const newyearColors: ThemeColors = {
  primary: 'red',
  primaryHover: 'red-500',
  primaryLight: 'red-400',
  primaryDark: 'red-600',
  bgMain: '#160808',
  bgCard: 'red-900/30',
  bgCardHover: 'red-500/20',
  bgOverlay: 'red-900/40',
  textPrimary: 'red-50',
  textSecondary: 'red-200',
  textMuted: 'red-300',
  border: 'red-700/50',
  borderHover: 'red-600',
  accent: 'yellow-400',
  accentHover: 'yellow-500',
  success: 'green',
  successHover: 'green-500',
  bgGradient1: 'rgba(220, 38, 38, 0.16)',
  bgGradient2: 'rgba(251, 191, 36, 0.12)',
  bgGradient3: 'rgba(220, 38, 38, 0.1)',
  bgGradient4: '#160808',
};

const themeColorMap: Record<ThemeType, ThemeColors> = {
  bloom: bloomColors,
  night: nightColors,
  newyear: newyearColors,
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('bloom');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'bloom' || stored === 'night' || stored === 'newyear') {
      setThemeState(stored);
    } else if (stored === 'default') {
      setThemeState('bloom');
      localStorage.setItem(STORAGE_KEY_THEME, 'bloom');
    }
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);

    // Apply theme to document root for CSS variables
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const colors = themeColorMap[theme];
  const value = useMemo(() => ({ theme, setTheme, colors }), [theme, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
