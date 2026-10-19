/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Wraps ErrorBoundary with the active language translator.
 */

import React, { type ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ErrorBoundary } from './ErrorBoundary';

const I18nErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  return <ErrorBoundary t={t}>{children}</ErrorBoundary>;
};

export default I18nErrorBoundary;
