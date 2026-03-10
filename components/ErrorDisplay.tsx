/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared error message display. Use for inline generation/upload errors
 * so styling and optional icon stay consistent and backend error format can be
 * extended later (e.g. code + message).
 */

import React from 'react';

export interface ErrorDisplayProps {
  /** Already-translated error message (or raw message if no i18n). */
  message: string;
  /** Show warning icon before message. Default true. */
  showIcon?: boolean;
  /** Extra class names. Base: text-red-400 text-sm. */
  className?: string;
}

const DEFAULT_CLASS = 'text-red-400 text-sm';

export function ErrorDisplay({
  message,
  showIcon = true,
  className = '',
}: ErrorDisplayProps): React.ReactElement | null {
  if (!message) return null;
  const classes = [DEFAULT_CLASS, className].filter(Boolean).join(' ');
  return (
    <p className={classes} role="alert">
      {showIcon && (
        <span className="mr-1" aria-hidden>
          ⚠️
        </span>
      )}
      {message}
    </p>
  );
}
