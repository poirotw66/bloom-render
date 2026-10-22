/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * One-time dismissible “star us on GitHub” toast after the first successful generation
 * (including demo). Dismissal is remembered in localStorage forever.
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useGenerationSuccessCount } from '../utils/generationSuccess';
import { GITHUB_REPO_URL } from '../constants/site';
import { XMarkIcon } from './icons';

export const STORAGE_KEY_STAR_NUDGE_DISMISSED = 'pixshop_star_nudge_dismissed';

export function isStarNudgeDismissed(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(STORAGE_KEY_STAR_NUDGE_DISMISSED) === '1';
  } catch {
    return false;
  }
}

export function dismissStarNudge(
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY_STAR_NUDGE_DISMISSED, '1');
  } catch {
    /* ignore */
  }
}

const StarNudge: React.FC = () => {
  const { t } = useLanguage();
  const successCount = useGenerationSuccessCount();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStarNudgeDismissed()) {
      setVisible(false);
      return;
    }
    if (successCount >= 1) {
      setVisible(true);
    }
  }, [successCount]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 max-w-sm theme-raised theme-border border rounded-2xl p-4 flex flex-col gap-3 animate-fade-in"
      data-testid="star-nudge"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm theme-ink leading-relaxed">{t('star_nudge.message')}</p>
        <button
          type="button"
          className="shrink-0 p-1 rounded-lg theme-ink-muted hover:opacity-90 focus:outline-none focus-visible:brand-ring"
          aria-label={t('star_nudge.dismiss')}
          onClick={() => {
            dismissStarNudge();
            setVisible(false);
          }}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl brand-bg text-white text-sm font-semibold hover:opacity-95 focus:outline-none focus-visible:brand-ring"
        onClick={() => {
          dismissStarNudge();
          setVisible(false);
        }}
      >
        {t('star_nudge.cta')}
      </a>
    </div>
  );
};

export default StarNudge;
