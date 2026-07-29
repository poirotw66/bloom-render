/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reports partially-failed multi-image generations and offers to re-run only
 * the failed slots. Rendered above the results grid on every generate page.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getI18nErrorKey } from '../services/gemini/shared';
import { groupFailureReasons, type GenerationFailure } from '../utils/generationHelpers';
import { RefreshIcon } from './icons';
import { UI_BTN_SECONDARY } from '../utils/uiClasses';

interface GenerationFailureNoticeProps {
  failures: GenerationFailure[];
  requestedCount: number;
  succeededCount: number;
  isRetrying: boolean;
  onRetry: () => void;
  /** Error-message context passed to the API error classifier (e.g. 'portrait'). */
  context?: string;
  className?: string;
}

const GenerationFailureNotice: React.FC<GenerationFailureNoticeProps> = ({
  failures,
  requestedCount,
  succeededCount,
  isRetrying,
  onRetry,
  context = 'generation',
  className = '',
}) => {
  const { t } = useLanguage();

  if (failures.length === 0) return null;

  const reasons = groupFailureReasons(failures, (reason) => getI18nErrorKey(reason, context));

  return (
    <div
      role="status"
      className={`w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-left ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-bold text-amber-200">
            {t('generation.partial_title', { done: succeededCount, total: requestedCount })}
          </p>

          <ul className="space-y-1">
            {reasons.map(({ key, count }) => (
              <li key={key} className="text-xs text-amber-100/90">
                {count > 1 ? `${count} × ` : ''}
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying}
          className={`${UI_BTN_SECONDARY} shrink-0 text-sm`}
        >
          <RefreshIcon className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying
            ? t('generation.retrying')
            : t('generation.retry_failed', { count: failures.length })}
        </button>
      </div>
    </div>
  );
};

export default GenerationFailureNotice;
