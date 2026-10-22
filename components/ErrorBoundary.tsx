/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Root-level Error Boundary to prevent full app crash on uncaught errors.
 * Renders a fallback UI with reload option.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../utils/logger';

type Translate = (key: string) => string;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional i18n; when omitted, English fallbacks are used. */
  t?: Translate;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const EN_FALLBACK: Record<string, string> = {
  'error.boundary_title': 'Something went wrong',
  'error.boundary_body': 'An unexpected error occurred. Please try reloading the page.',
  'error.boundary_reload': 'Reload page',
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private translate(key: string): string {
    if (this.props.t) return this.props.t(key);
    return EN_FALLBACK[key] ?? key;
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-gray-900 text-gray-100">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-bold text-red-400">
              {this.translate('error.boundary_title')}
            </h1>
            <p className="text-sm text-gray-400">{this.translate('error.boundary_body')}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              {this.translate('error.boundary_reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
