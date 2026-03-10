/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

/** 繁花 (Bloom): warm fuchsia/pink gradients, flower petals */
const bloomColors: ThemeColors = {
  primary: 'fuchsia',
  primaryHover: 'fuchsia-500',
  primaryLight: 'fuchsia-400',
  primaryDark: 'fuchsia-600',
  bgMain: '#0c0a0f',
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
  bgGradient1: 'rgba(236, 72, 153, 0.25)',
  bgGradient2: 'rgba(168, 85, 247, 0.2)',
  bgGradient3: 'rgba(217, 70, 239, 0.22)',
  bgGradient4: '#1B2735',
};

/** 深夜 (Night): dark blue/slate, minimal, star-focused */
const nightColors: ThemeColors = {
  primary: 'blue',
  primaryHover: 'blue-500',
  primaryLight: 'blue-400',
  primaryDark: 'blue-600',
  bgMain: '#000000',
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
  bgGradient4: '#000000',
};

const newyearColors: ThemeColors = {
  primary: 'red',
  primaryHover: 'red-500',
  primaryLight: 'red-400',
  primaryDark: 'red-600',
  bgMain: '#1a0000',
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
  bgGradient1: 'rgba(220, 38, 38, 0.3)',
  bgGradient2: 'rgba(234, 179, 8, 0.25)',
  bgGradient3: 'rgba(220, 38, 38, 0.2)',
  bgGradient4: '#2a0000',
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
