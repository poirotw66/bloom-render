/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * One-click OpenRouter OAuth PKCE sign-in / sign-out control.
 */

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';
import { beginOpenRouterOAuth } from '../utils/openRouterOAuth';
import { logger } from '../utils/logger';

interface OpenRouterSignInButtonProps {
  className?: string;
  /** Compact styling for the hero notice row. */
  compact?: boolean;
}

const btnSignIn: Record<ThemeType, string> = {
  bloom: 'brand-bg-strong text-white hover:opacity-95 focus-visible:brand-ring',
  night: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-400',
  newyear: 'bg-red-700 text-yellow-50 hover:bg-red-600 focus-visible:ring-yellow-400',
};

const btnSignOut: Record<ThemeType, string> = {
  bloom: 'theme-ink border theme-border-strong hover:brand-bg-tint focus-visible:brand-ring',
  night: 'text-sky-100 border border-sky-400/50 hover:bg-sky-900/50 focus-visible:ring-sky-300',
  newyear:
    'text-yellow-100 border border-yellow-400/50 hover:bg-red-800/50 focus-visible:ring-yellow-400',
};

const OpenRouterSignInButton: React.FC<OpenRouterSignInButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { openRouterApiKey, setOpenRouterApiKey } = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = Boolean(openRouterApiKey.trim());
  const pad = compact ? 'px-3 py-1.5 text-base' : 'px-4 py-2.5 text-sm w-full';

  const onSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await beginOpenRouterOAuth();
    } catch (err) {
      logger.error('OpenRouter OAuth start failed:', err);
      setError(t('openrouter.oauth_start_failed'));
      setBusy(false);
    }
  };

  const onSignOut = () => {
    setOpenRouterApiKey('');
    setError(null);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {signedIn ? (
        <button
          type="button"
          data-testid="openrouter-sign-out"
          disabled={busy}
          onClick={onSignOut}
          className={`${pad} rounded-lg font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] disabled:opacity-60 ${btnSignOut[theme]}`}
        >
          {t('openrouter.sign_out')}
        </button>
      ) : (
        <button
          type="button"
          data-testid="openrouter-sign-in"
          disabled={busy}
          onClick={() => void onSignIn()}
          className={`${pad} rounded-lg font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] disabled:opacity-60 ${btnSignIn[theme]}`}
        >
          {busy ? t('openrouter.signing_in') : t('openrouter.sign_in')}
        </button>
      )}
      {signedIn && (
        <p className="text-xs theme-ink-muted" data-testid="openrouter-signed-in-hint">
          {t('openrouter.signed_in_hint')}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default OpenRouterSignInButton;
