/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified logging utility with environment-aware output.
 * In development: all logs are output
 * In production: debug/info are skipped; warn/error still call console (see vite.config esbuild.drop).
 */

const isDev = import.meta.env.DEV;

/**
 * Logger utility for consistent logging across the application.
 * Automatically filters debug/info logs in production builds.
 */
export const logger = {
  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning-level logging (always output)
   * Use for non-critical issues that should be investigated
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error-level logging (always output)
   * Use for errors and exceptions
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log with custom prefix (development only)
   * Use for categorized logging
   */
  log: (prefix: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[${prefix}]`, ...args);
    }
  },
};

/**
 * Performance logging utility (development only)
 * Use for measuring execution time
 */
export const perfLogger = {
  /**
   * Start a performance measurement
   * @param label - Label for the measurement
   */
  start: (label: string) => {
    if (isDev) {
      console.time(`[PERF] ${label}`);
    }
  },

  /**
   * End a performance measurement
   * @param label - Label for the measurement (must match start label)
   */
  end: (label: string) => {
    if (isDev) {
      console.timeEnd(`[PERF] ${label}`);
    }
  },
};

// Made with Bob
